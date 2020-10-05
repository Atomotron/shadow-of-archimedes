'use strict'
/* A force from a point that acts on physics particles */
class ForceNode {
    constructor(pos=new Vec(),strength=0,drag=0,immobile=false) {
        this.pos = pos;
        this.strength = strength;
        this.drag = drag;
        this.immobile = immobile; // To be used later for freezing
        this.accumulator = new Vec();
    }
    // Default radial force with drag support
    impulse(particle,dt) {
        // Gravitate
        Vec.Sub(this.accumulator,this.pos,particle.pos);
        this.accumulator.mapabseq((r) => this.strength*dt);
        particle.vel.addeq(this.accumulator);
        // Drag
        Vec.Mul(this.accumulator,particle.vel,this.drag);
        particle.vel.subeq(this.accumulator);
    }
}

class SpringForceNode extends ForceNode{
    impulse(particle,dt) {
        // Gravitate
        Vec.Sub(this.accumulator,this.pos,particle.pos);
        this.accumulator.muleq(this.strength*dt);
        particle.vel.addeq(this.accumulator);
        // Drag
        Vec.Mul(this.accumulator,particle.vel,this.drag);
        particle.vel.subeq(this.accumulator);
    }
}

/* An object with drag that can be sucked to a point. */ 
class PhysicsParticle {
    constructor(pos=new Vec(),vel=new Vec(),force_node=null) {
        this.pos = pos;
        this.vel = vel;
        this.accumulator = new Vec();
        this.force_node = force_node;
    }
    update(engine,dt) {
        // Apply force
        if (this.force_node) this.force_node.impulse(this,dt);
        // Integrate
        Vec.Mul(this.accumulator,this.vel,dt);
        Vec.Add(this.pos,this.pos,this.accumulator);
        // Planet collision
        this.planet_collide(engine,dt);
    }
    planet_collide(engine,dt) {
        this.pos.mapabseq(
            (r) => {
                if (r < PLANET_RADIUS) {
                    // Delete the component of velocity that points in to the planet's surface.
                    Vec.Proj(this.accumulator,this.pos,this.vel);
                    this.accumulator.muleq(PARTICLE_ELASTICITY);
                    Vec.Sub(this.vel,this.vel,this.accumulator);
                    Vec.Mul(this.accumulator,this.vel,PARTICLE_FRICTION);
                    this.vel.subeq(this.accumulator); // Friction
                    return PLANET_RADIUS
                } else {
                    return r;
                }
            }
        )
    }
}
class PassthroughParticle extends PhysicsParticle{
    planet_collide(engine,dt) {}
}


