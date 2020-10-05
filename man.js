'use strict'
class Man extends NightdaySprite {
    constructor(engine,pass) {
        super(engine,pass,
            "Tex/man1.png", // image
            1,1.0,1, // variant, layer, scale
        );
        this.frames = [
            "Tex/man1.png",
            "Tex/man2.png",
            "Tex/man3.png",
            "Tex/man4.png",
            "Tex/man5.png",
            "Tex/man6.png",
            "Tex/man7.png",
        ];
        this.step_sounds = [
            "stone_walk1",
            "stone_walk2",
            "stone_walk3",
            "stone_walk4",
            "stone_walk5",
        ];
        this.frame_age = 0;
        this.frame = 0;
        this.target = new Vec(MAN_RADIUS,0.0);
        this.vel_mul = 0;
        this.walking = false;
        this.r_defect = 0;
        this.r_vel = 0;
        this.temperature = 0;
        
        // Set up clickable region for jumping  
        const that = this;
        this.click_region = new Clickable(this.pos,0.25,() => {
            if (!that.jumped) {
                that.r_vel = MAN_JUMP_VEL;
                that.jumped = true;
            }
        });
        this.engine.clickables.add(this.click_region);
        
        // Set up inventory
        this.inventory = [];
        this.inventory_slots = [];
        this.inventory_root = this.pos.clone();
        
        // Put in the right spot
        this.pos.eq(new Vec(1.0,0.0));
        this.update_pos(0);
    }
    // Gets an item of the right type of the man's inventory, returning either an Item or null (if no such item was found)
    getItem(type) {
        let found_index = null;
        for (let i=0; i<this.inventory.length; ++i) {
            if (this.inventory[i].type === type) {
                found_index = i;
                break;
            }
        }
        if (found_index === null) return null;
        const found = this.inventory[found_index];
        this.inventory.splice(found_index,1);
        this.recalculateInventorySlots();
        return found;
    }
    // Puts an item in the man's inventory
    putItem(item) {
        this.inventory.push(item);
        this.recalculateInventorySlots();
    }
    recalculateInventorySlots() {
        this.inventory_slots = [];
        let i = 0;
        for (const item of this.inventory) {
            const slot = new SpringForceNode(
                this.pos.clone(),
                MAN_INVENTORY_FORCE,
                MAN_INVENTORY_DRAG,
            );
            this.inventory_slots.push(slot);
            item.particle.force_node = slot;
            i += 1;
        }
    }    
    // Called by the engine if a click is not trapped by anything else
    setTarget(target) {
        this.target.eq(target);
    }
    facing() {
        return this.pos.norm().rot90eq().muleq(this.mirror ? -1:1);
    }
    update_pos(dt) {
        // Update position
        const dr = this.target.sub(this.pos);
        this.walking = dr.abs() > MAN_WALK_SATISFACTION_RANGE;
        if (this.walking) {
            this.pos.addeq(
                dr.normeq().muleq(MAN_SPEED*dt)
            );
        };
        this.r_defect += this.r_vel*dt;
        this.r_vel -= GRAVITY*dt;
        if (this.r_defect < 0) {
            this.r_vel = 0
            this.r_defect = 0;
            this.jumped = false;
        }
        this.pos.normeq().muleq(MAN_RADIUS + this.r_defect);
        this.mirror = this.pos.cross(dr) < 0;
        this.transform_computed = false;
        // Update temperature
        const external_temperature = TEMPERATURE_SCALE*this.pos.dot(this.engine.scene.solar_vector);
        this.temperature = external_temperature;
        
        // Update inventory pos
        this.inventory_root.eq(this.pos);
        const facing = this.facing();
        facing.muleq(-MAN_INVENTORY_BEHIND);
        let i = Math.exp(0.5);
        for (const slot of this.inventory_slots) {
            slot.pos.eq(this.inventory_root.add(facing.mul(Math.log(i)*2)));
            slot.pos.normeq().muleq(MAN_INVENTORY_HEIGHT + this.r_defect);
            i += 1;
        }
    }
    update(dt) {
        // Update target
        if (this.engine.cm.mouse_pressed && !this.engine.click_consumed) {
            this.target.eq(this.engine.mouse_pos);
        }
        this.update_pos(dt);
        this.target.normeq().muleq(MAN_RADIUS)
        // Update animation
        this.frame_age += dt;
        if ((this.walking || this.frame != 0) && this.frame_age > MAN_FRAME_TIME) {
            if (this.frame === 3) {
                this.engine.sound.play(
                    this.step_sounds[Math.floor(Math.random()*this.step_sounds.length)]
                );
            }
            this.frame = this.frame+1;
            if (this.walking) {
                if (this.frame >= this.frames.length) {
                    this.frame = 3;
                }
            } else {
                if (this.frame >= 4) {
                    this.frame = 0;
                }
            }                
            this.frame_age = 0;
            this.setImage(this.frames[this.frame]);
        }
        super.update(dt);
    }
}
