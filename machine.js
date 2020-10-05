'use strict'

const MACHINE_STAGES = [
    new ArrayFloats(new Float32Array([0.0,0.0,0.0])), // 0 - nothing built
    new ArrayFloats(new Float32Array([2/3,0.0,0.0])), // 1 - base
    new ArrayFloats(new Float32Array([4/3,0.0,0.0])), // 2
    new ArrayFloats(new Float32Array([4/3,2/3,0.0])), // 3
    new ArrayFloats(new Float32Array([4/3,4/3,0.0])), // 4
    new ArrayFloats(new Float32Array([4/3,4/3,2/3])), // 5
    new ArrayFloats(new Float32Array([4/3,4/3,4/3])), // 6
];

class Machine extends NightdaySprite {
    constructor(engine,pass,pos,type) {
        super(engine,pass,
            MACHINE_CONFIG[type].image,
            1, // variant
            0.75, // layer
            1, // scale
        );
        this.construct_sounds = [
            "construct1",
            "construct2",
            "construct3",
        ];
        this.pos = pos;
        this.type = type;
        this.config = MACHINE_CONFIG[type];
        const ihat = pos.norm();
        const jhat = ihat.rot90();
        this.produce_root = this.pos.add(ihat);
        // Construction components
        this.component_slots = [];
        const res_root = pos.add(ihat.mul(MACHINE_SLOT_Y)).add(jhat.mul(MACHINE_SLOT_X));
        for (const name in this.config.components) {
            const count = this.config.components[name];
            for (let i=0; i<count; ++i) {
                this.component_slots.push(
                    new ItemSlot(this.engine,res_root.add(ihat.mul(MACHINE_SLOT_SPACING*i)),name)
                )
            }
        }
        // Process consumption
        this.consume_slots = [];
        let con_head = res_root.add(jhat.mul(-MACHINE_SLOT_SPACING));
        for (let stocki=0; stocki < this.config.stock; ++stocki) {
            for (const name in this.config.consumes) {
                const count = this.config.consumes[name];
                for (let i=0; i<count; ++i) {
                    let slot = new ItemSlot(this.engine,con_head.clone(),name);
                    slot.radius_target = 0;
                    this.consume_slots.push(slot);
                    con_head.addeq(ihat.mul(MACHINE_SLOT_SPACING));
                }
            }
        }
        // Construction animation
        this.frame_age = 0;
        this.variant_target = 1;
        this.previous_full_slots = 0;
        // Running
        this.run_time = 0;
        this.consume_timer = 0;
        this.produce_timer = 0;
        this.running = false;
    }
    setImage(image,variant=null,layer=null) {
        this.image = image;
        variant = variant === null ? this.variant : variant;
        this.variant = variant;
        layer = layer === null ? this.layer : layer;
        this.layer = layer;
        if (image !== null) {
            this.sprite_matrix.eq(engine.il.model_frames.get(image));
            this.data.uv.eq(engine.il.texture_frames.get(image));
            this.data.variant_mask.eq(MACHINE_STAGES[variant])
            this.data.layer.set(layer);
        } else {
            this.sprite_matrix.zeroeq();
            this.data.uv.zeroeq();
        }
        this.transform_computed = false;
    }
    count_full(slot_list) {
        let full = 0;
        for (const slot of slot_list) {
            if (slot.holding !== null) full += 1;
        }
        return full;
    }
    get_consumption_slots() {
        const slots = [];
        for (name in this.config.consumes) {
            let countdown = this.config.consumes[name];
            for (const slot of this.consume_slots) {
                if (slot.holding !== null && slot.holding.type == name) {
                    slots.push(slot);
                    countdown -= 1;
                }
                if (countdown === 0) {
                    break; // Don't find too many
                }
            }
            if (countdown !== 0) {
                return null; // Couldn't find enough stuff.
            }
        }
        return slots;
    }
    can_consume() {
        return this.get_consumption_slots() !== null;
    }
    consume() {
        const slots = this.get_consumption_slots();
        if (slots === null) return;
        for (const slot of slots) {
            slot.clear();
        }
    }
    produce() {
        for (const name in this.config.produces) {
            const count = this.config.produces[name];
            for (let i=0; i<count; ++i) {
                new Item(
                    this.engine,// engine
                    this.produce_root, // Pos
                    new Vec(1.0,Math.random()-0.5), // Vel
                    name, // type
                );
            }
        }
    }
    update(dt) {
        // Determine construction goal
        const full_slot_count = this.count_full(this.component_slots);
        if (this.previous_full_slots !== full_slot_count) {
            this.previous_full_slots = full_slot_count
            this.variant_target = Math.round(full_slot_count/this.component_slots.length*(MACHINE_STAGES.length-1));
        }
        // Terraformers are bare rocks at variant level 1, they never go to 0.
        if (this.type === "terraformer" && this.variant_target < 1) this.variant_target = 1;
        if (this.variant !== this.variant_target) {
            this.frame_age += dt;
            if (this.frame_age > CONSTRUCTION_ANIM_FRAME_TIME) {
                this.frame_age = 0.0;
                this.variant = (this.variant + (this.variant > this.variant_target ? -1 : 1));
                this.engine.sound.play(
                    this.construct_sounds[Math.floor(Math.random()*this.construct_sounds.length)]
                );
            }
            this.setImage(this.image,this.variant);
            for (const slot of this.consume_slots) slot.disable();
        }
        if (this.variant === this.variant_target && this.variant_target === MACHINE_STAGES.length-1) {
            for (const slot of this.consume_slots) slot.enable();
            if (this.type !== "terraformer") for (const slot of this.component_slots) slot.consume();
            // Construction complete
            if (this.can_consume()) {
                this.run_time += dt;
                this.consume_timer += dt;
                if (this.consume_timer > this.config.consume_time) {
                    this.consume_timer = 0;
                    this.consume();
                }
                this.produce_timer += dt;
                if (this.produce_timer > this.config.produce_time) {
                    this.produce_timer = 0;
                    this.produce();
                }
                this.scale_y = 1.0 + RUNNING_WIGGLE_MAGNITUDE*Math.sin(RUNNING_WIGGLE_SPEED*this.run_time);
                this.transform_computed = false;
                // When running changes
                if (!this.running) {
                    this.running = true;
                    this.onStartRunning();
                }
            } else {
                if (this.running) {
                    this.running = false;
                    this.onStopRunning();
                }
            }
        } else {
            this.run_time = 0; // Incomplete
            this.produce_timer = 0;
            if (this.running) {
                this.running = false;
                this.onStopRunning();
            }
        }
        if (this.variant === 0) {
            this.destroy();
        }
        super.update(dt);
    }
    onStopRunning() {
        if (this.type === "terraformer") {
            this.engine.running_terraformers -= 1;
        }
    }
    onStartRunning() {
        if (this.type === "terraformer") {
            this.engine.running_terraformers += 1;
            this.engine.sound.play("terraformer_start");
        }    
    }
    destroy() {
        this.engine.machines.delete(this);
        for (const slot of this.consume_slots) slot.destroy();
        for (const slot of this.component_slots) slot.destroy();
        super.destroy();
    }
}

