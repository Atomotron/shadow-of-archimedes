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
        this.death_frames = [
            "Tex/death1.png",
            "Tex/death2.png",
            "Tex/death3.png",
            "Tex/death4.png",
            "Tex/death5.png",
            "Tex/death6.png",
            "Tex/death7.png",
            "Tex/death8.png",
            "Tex/death9.png",
            "Tex/death10.png",
            "Tex/death11.png",
        ];
        this.jump_frame = "Tex/man-jump.png";
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
        this.click_region = new Clickable(this.pos,0.25,() => {this.jump()});
        this.engine.clickables.add(this.click_region);
        
        // Set up inventory
        this.inventory = [];
        this.inventory_slots = [];
        this.inventory_root = this.pos.clone();
        
        // Put in the right spot
        this.pos.eq(new Vec(1.0,0.0));
        this.update_pos(0);
        this.dead = false;
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
        if (found_index === null) {
            this.engine.sound.play("fail");
            return null
        };
        const found = this.inventory[found_index];
        this.inventory.splice(found_index,1);
        this.recalculateInventorySlots();
        this.engine.sound.play("deposit");
        return found;
    }
    // Puts an item in the man's inventory
    putItem(item) {
        this.inventory.push(item);
        this.recalculateInventorySlots();
        this.engine.item_tutorial_message.hide();
        this.engine.sound.play("pickup");
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
    dropEverything() {
        for (const i of this.inventory) i.drop();
        this.inventory = [];
        this.recalculateInventorySlots();
    }
    // Called by the engine if a click is not trapped by anything else
    setTarget(target) {
        this.target.eq(target);
    }
    jump() {
        if (!this.jumped && !this.dead) {
            this.r_vel = MAN_JUMP_VEL;
            this.jumped = true;
        }
    }
    facing() {
        return this.pos.norm().rot90eq().muleq(this.mirror ? -1:1);
    }
    update_pos(dt) {
        // Update position
        let dr = this.target.sub(this.pos);
        let keyboard_control = false;
        if (this.engine.cm.isPressed("KeyA") || 
            this.engine.cm.isPressed("ArrowLeft")) {
            dr.eq(this.pos.norm().rot90().muleq(0.1+MAN_WALK_SATISFACTION_RANGE));    
            keyboard_control = true;
        } else if (this.engine.cm.isPressed("KeyD") || 
            this.engine.cm.isPressed("ArrowRight")) {
            dr.eq(this.pos.norm().rot90().muleq(-0.1-MAN_WALK_SATISFACTION_RANGE));  
            keyboard_control = true;   
        }
        if (this.engine.cm.isPressed("KeyW") || 
            this.engine.cm.isPressed("ArrowUp") || 
            this.engine.cm.isPressed("Space")) this.jump();
        
        // Dead men can't move
        if (this.dead) dr.zeroeq();
        
        // Update motion
        this.r_vel -= GRAVITY*0.016;
        this.r_defect += this.r_vel*dt;
        if (this.r_defect < 0) {
            this.r_vel = 0
            this.r_defect = 0;
            if (this.jumped) {
                this.engine.sound.play("jump_land");
            }
            this.jumped = false;
        }
        this.walking = dr.abs() > MAN_WALK_SATISFACTION_RANGE;
        if (this.walking) {
            this.pos.addeq(
                dr.normeq().muleq(MAN_SPEED*dt)
            );
        };
        this.pos.normeq().muleq(MAN_RADIUS + this.r_defect);
        if (keyboard_control) {
            this.target.eq(this.pos);
        }
        const satisfaction = this.pos.cross(dr);
        if (satisfaction < -0.01) this.mirror = true;
        if (satisfaction > 0.01) this.mirror = false;
        //debugger;
        this.transform_computed = false;
        // Update temperature
        const external_temperature = TEMPERATURE_SCALE*this.pos.dot(this.engine.scene.solar_vector);
        this.temperature = external_temperature;
        if (this.temperature > 0.5 || this.temperature < -0.5) {
            if (!this.dead) {
                this.dropEverything();
                this.frame = 0;
            }
            this.dead = true;
        }
        
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
        if (this.jumped) {
            this.setImage(this.jump_frame);
        } else if (!this.dead) {
            this.frame_age += dt;
            if ((this.walking || this.frame != 0) && this.frame_age > MAN_FRAME_TIME) {
                if (this.frame === 3 && !this.jumped) {
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
            }
            this.setImage(this.frames[this.frame]);
        } else {
            this.frame_age += dt;
            if (this.frame_age > MAN_FRAME_TIME) {
                this.frame = this.frame+1;
                this.frame_age = 0;
                if (this.frame >= this.death_frames.length) this.frame = this.death_frames.length-1;
            }
            this.setImage(this.death_frames[this.frame]);
        }
        super.update(dt);
    }
}
