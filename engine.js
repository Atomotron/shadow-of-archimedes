'use strict'

class Engine {
    constructor(canvas_container,shader_programs,images,frames,music,sfx) {
        this.cm = new CanvasManager(canvas_container);
        if (this.cm.gl !== null) {
            this.gl = this.cm.gl;
            let countdown = 3; // The number of loaders that need to finish
            const that = this;
            function decrement(_decrementer) {
                countdown -= 1;
                if (countdown === 0) {
                    that.start();
                }
            }
            // Start loaders
            this.sc = new ShaderCompiler(this.gl,shader_programs);
            this.il = new ImageLoader(this.gl,images,frames,decrement);
            this.sound = new Sounds(music,sfx,decrement);
            // Set up unsticking
            function unstick(_e) {
                that.sound.unstick();
                console.log("Unstuck audio playback.");
                window.removeEventListener('click',unstick);
            }
            window.addEventListener('click',unstick);
            // Check shader compiler for errors.
            if (this.sc.errors.length === 0) {
                decrement();
            } else {
                for (const e of this.sc.errors) {
                    console.log(e.toString());
                }
            }            
        }
    }
    start() {
        this.scene = new Scene(this.gl);
        this.mouse_pos = new Vec();
        this.sprites = new Set();
        if (!this.il.textures.get('spritesheet')) { 
        } else {
            // Sprite pass
            this.spritepass = new SpritePass(this.gl,
                this.scene,
                this.sc.programs.get('sprite'),
                this.il.textures.get('spritesheet'),
            );
            this.scene.addPass(this.spritepass,0.0);
        }
        this.setup();
        // Start mainloop
        let last_t = null;
        const that = this;
        this.toggle = true;
        let frames = 0;
        let time = 0;
        let average_dt = 1/60;
        (function loop(t) {
            that.cm.updateSize();
            const inverse_view = that.scene.view.inv();
            that.mouse_pos.eq(inverse_view.transform(new Vec(that.cm.mouse_x,that.cm.mouse_y)));
            if (last_t !== null) {
                // DT smoothing because animation juddering can be very easy to notice.
                let dt = (t-last_t)*0.001;
                if (dt > 0.04) dt = 0.04;
                time += dt;
                frames += 1;
                if (frames >= 15) {
                    average_dt = time/frames;
                    time = 0; frames = 0;
                }
                that.update(average_dt);
                that.scene.update(average_dt);
                that.scene.prepare(that.gl);
                that.scene.draw(that.gl);
                that.sound.tick(dt);
            }
            last_t = t;
            window.requestAnimationFrame(loop);
        })(null);
    }
    setup() {}
    update(dt) {
        for (const sprite of this.sprites) {
            sprite.update(dt);
        }
    }
}

class Sprite {
    constructor(engine,pass,image=null) {
        this.engine = engine;
        this.pass = pass;
        this.angle = 0;
        this.scale = 1;
        this.pos = new Vec();
        this.mirror = false;
        this.data = pass.dvao.acquire(engine.gl);
        this.sprite_matrix = new Mat();
        this.rotation = new Mat();
        this.translation = new Mat();
        this.scaling = new Mat();
        this.setImage(image);
        this.engine.sprites.add(this);
    }
    destroy() {
        this.pass.dvao.relenquish(this.data);
        this.engine.sprites.delete(this);
    }
    setImage(image) {
        this.image = image;
        if (image !== null) {
            if (!this.engine.il.model_frames.has(image)) {
                console.error("Missing image:",image);
            }
            this.sprite_matrix.eq(this.engine.il.model_frames.get(image));
            this.data.uv.eq(this.engine.il.texture_frames.get(image));
        } else {
            this.sprite_matrix.zeroeq();
            this.data.uv.zeroeq();
        }
    }
    compute_transform() {
        // Set matrices from values
        this.rotation.rotationeq(this.angle);
        this.translation.translationeq(this.pos);
        if (this.mirror) {
            this.scaling.scalingeq(-this.scale,this.scale);
        } else {
            this.scaling.scalingeq(this.scale,this.scale);
        }
        // Compute model matrix
        this.data.model.eq(this.sprite_matrix);
        this.data.model.composeq(this.scaling);
        this.data.model.composeq(this.rotation);
        this.data.model.composeq(this.translation);
    }
    update(dt) {
        this.compute_transform();
    }
}
