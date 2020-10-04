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
        ]
        this.FRAME_TIME = 0.1;
        this.frame_age = 0;
        this.frame = 0;
        this.target = new Vec(MAN_RADIUS,0.0);
        this.vel_mul = 0;
        this.walking = false;
        this.r_defect = 0;
        this.r_vel = 0;
        
        // Set up clickable region for jumping  
        const that = this;
        this.click_region = new Clickable(this.pos,0.25,() => {
            if (!that.jumped) {
                that.r_vel = MAN_JUMP_VEL;
                that.jumped = true;
            }
        });
        this.engine.clickables.add(this.click_region);
    }
    update(dt) {
        // Update target
        if (this.engine.cm.mouse_pressed) {
            this.target.eq(this.engine.mouse_pos);
        }
        this.target.normeq().muleq(MAN_RADIUS)
        // Update position
        const dr = this.target.sub(this.pos);
        const walking = dr.abs() > MAN_WALK_SATISFACTION_RANGE;
        if (walking) {
            this.pos.addeq(
                dr.normeq().muleq(MAN_SPEED*dt)
            );
        };
        this.r_defect += this.r_vel*dt;
        this.r_vel += MAN_GRAVITY*dt;
        if (this.r_defect < 0) {
            this.r_vel = 0
            this.r_defect = 0;
            this.jumped = false;
        }
        this.pos.normeq().muleq(MAN_RADIUS + this.r_defect);
        this.mirror = this.pos.cross(dr) < 0;
        this.transform_computed = false;
        // Update animation
        this.frame_age += dt;
        if ((walking || this.frame != 0) && this.frame_age > this.FRAME_TIME) {
            if (this.frame === 3) {
                this.engine.sound.play(
                    this.step_sounds[Math.floor(Math.random()*this.step_sounds.length)]
                );
            }
            this.frame = this.frame+1;
            if (walking) {
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
