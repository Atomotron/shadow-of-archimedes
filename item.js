'use strict'

class Item extends Sprite {
    constructor(engine,pos=new Vec(),vel=new Vec(),type="carbon") {
        super(engine,engine.itempass,
            {
                'carbon':"Items/item-carbom.png",
                'battery':"Items/item-battery.png",
                'metal':"Items/item-metal.png",
                'water':"Items/item-water.png",
            }[type]      
        );
        this.type = type; 
        this.scale = ITEM_SCALE;
        this.pos.eq(pos);
        this.particle = new PhysicsParticle(this.pos,vel,engine.gravity);
        engine.live_particles.add(this.particle);
        this.click_region = new Clickable(this.pos,ITEM_CLICK_RADIUS,()=>{this.clickitem();});
        engine.clickables.add(this.click_region);        
        this.holder = null;
        engine.items.add(this);
    }
    destroy() {
        super.destroy();
        engine.live_particles.delete(this.particle);
        engine.clickables.delete(this.click_region);
    }
    clickitem() {
        if (this.holder === null || this.holder instanceof ItemSlot) {
            if (this.holder instanceof ItemSlot) {
                this.holder.holding = null;
            }
            this.click_region.r = 0;
            this.holder = this.engine.man;
            this.engine.man.putItem(this);
        }
    }
    update(dt) {
        this.angle = -Math.atan2(-this.pos.x,this.pos.y);
        if (this.holder === null && Math.random() < dt/ITEM_JUMP_FREQUENCY) {
            this.particle.vel.addeq(this.pos.norm().mul(ITEM_JUMP_POWER));
        }
        if (this.holder === null) this.click_region.r = ITEM_CLICK_RADIUS;
        else this.click_region.r = 0;
        super.update(dt);
    }
}
class ItemSlot extends Sprite {
    constructor(engine,pos=new Vec(),holds="carbon") {
        super(engine,engine.spritepass,
            {
                'carbon':"Items/slot-carbom.png",
                'battery':"Items/slot-battery.png",
                'metal':"Items/slot-metal.png",
                'water':"Items/slot-water.png",
            }[holds]        
        );
        this.scale = 0.5;
        this.pos.eq(pos);
        this.slot_force = new SpringForceNode(this.pos,ITEM_SLOT_FORCE,ITEM_SLOT_DRAG);
        this.click_region = new Clickable(this.pos,ITEM_CLICK_RADIUS,()=>{this.clickslot();});
        engine.clickables.add(this.click_region);
        this.holds = holds;
        this.holding = null;
        this.radius = 0.0;
        this.radius_target = 1.0;
        this.doomed = false;
    }
    clickslot() {
        if (this.holding !== null) {
            this.holding.clickitem();
            return;
        }
        const item = this.engine.man.getItem(this.holds);
        if (item !== null) {
            this.holding = item;
            item.holder = this;
            item.particle.force_node = this.slot_force;
            item.click_region.r = 0.0;
        }
    }
    clear() {
        if (this.holding !== null) {
            this.holding.destroy();
            this.holding.click_region.r = ITEM_CLICK_RADIUS;
            this.holding = null;
        }
    }
    destroy() {
        this.clear();
        this.disable();
        engine.clickables.delete(this.click_region);
        this.doomed = true;
    }
    enable() {
        this.radius_target = 1.0;
    }
    disable() {
        if (this.holding !== null) {
            this.holding.particle.force_node = this.engine.gravity;
            this.holding.holder = null;
            this.holding = null;
        }
        this.radius_target = 0.0;
    }
    update(dt) {
        this.scale = ITEM_SCALE*this.radius;
        this.click_region.r = ITEM_CLICK_RADIUS*this.radius_target;
        this.radius += ITEM_SLOT_SCALE_SPEED*(this.radius_target - this.radius)*dt;
        if (this.doomed && this.radius < 0.01) {
            super.destroy();
        }
        this.angle = -Math.atan2(-this.pos.x,this.pos.y);
        super.update(dt);
    }
}
