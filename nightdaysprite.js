'use strict'

class NightdaySpritePass extends RenderPass{
    constructor(gl,scene,program,gradient,texture) {
        super(gl,program);
        this.scene = scene;
        this.texture = texture;
        this.gradient = gradient;
        this.dvao = this.makeDVAO(gl,program,scene);
        // Texture locations
        this.spritesheet_loc = gl.getUniformLocation(program,"spritesheet");
        this.gradient_texture_loc = gl.getUniformLocation(program,"gradient");
        // Uniform locations
        this.view_loc = gl.getUniformLocation(program,"view");
        this.solar_loc = gl.getUniformLocation(program,"solar_vector");
        this.view = new Mat();
    }
    makeDVAO(gl,program,scene) {
        return new DynamicVAO(gl,program,scene.square_vao,{
            model: {type:'mat',dynamic:false},
            uv: {type:'mat',dynamic:false},
            layer: {type:'scalar',dynamic:false},
            variant_mask: {type:'color',dynamic:false},
        },8);
    }
    update(scene,dt) {
        this.view.eq(scene.view);
    }
    prepare(gl) {
        this.dvao.prepare(gl);
    }
    draw(gl) {
        gl.useProgram(this.program);
        // Texture 0: Spritesheet
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(this.gradient_texture_loc, 0);
        gl.bindTexture(gl.TEXTURE_2D, this.gradient);
        // Texture 1: Gradient
        gl.activeTexture(gl.TEXTURE1);
        gl.uniform1i(this.spritesheet_loc, 1);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        // Uniforms
        gl.uniformMatrix3fv(this.view_loc,false,this.view.a);
        gl.uniform2fv(this.solar_loc,this.scene.solar_vector.a);
        this.dvao.draw(gl);
    }
}

class AnimatedSpritePass extends NightdaySpritePass {
    makeDVAO(gl,program,scene) {
        return new DynamicVAO(gl,program,scene.square_vao,{
            model: {type:'mat',dynamic:true},
            uv: {type:'mat',dynamic:true},
            layer: {type:'scalar',dynamic:false},
            variant_mask: {type:'color',dynamic:true},
        },1);
    }
}

const VARIANT_R = 1;
const VARIANT_G = 2;
const VARIANT_B = 4;

class NightdaySprite {
    constructor(engine,pass,image=null,variant=0,layer=0.75,scale=1) {
        this.engine = engine;
        this.pass = pass;
        this.variant = variant;
        this.layer = layer;
        this.scale = scale;
        this.pos = new Vec();
        this.mirror = false;
        this.data = pass.dvao.acquire(engine.gl);
        this.sprite_matrix = new Mat();
        this.rotation = new Mat();
        this.translation = new Mat();
        this.scaling = new Mat();
        this.setImage(image,variant,layer);
        this.transform_computed = false;
        this.engine.sprites.add(this);
    }
    destroy() {
        this.pass.dvao.relenquish(this.data);
        this.engine.sprites.delete(this);
    }
    setImage(image,variant=null,layer=null) {
        this.image = image;
        variant = variant === null ? this.variant : variant;
        layer = layer === null ? this.layer : layer;
        if (image !== null) {
            this.sprite_matrix.eq(engine.il.model_frames.get(image));
            this.data.uv.eq(engine.il.texture_frames.get(image));
            this.data.variant_mask.a[0] = variant & VARIANT_R ? 1.0 : 0.0;
            this.data.variant_mask.a[1] = variant & VARIANT_G ? 1.0 : 0.0;
            this.data.variant_mask.a[2] = variant & VARIANT_B ? 1.0 : 0.0;
            this.data.layer.set(layer);
        } else {
            this.sprite_matrix.zeroeq();
            this.data.uv.zeroeq();
        }
        this.transform_computed = false;
    }
    compute_transform() {
        // Set matrices from values
        this.rotation.rotationeq(-Math.atan2(-this.pos.x,this.pos.y));
        this.translation.translationeq(this.pos);
        if (this.mirror) {
            this.scaling.scalingeq(-this.scale,this.scale);
        } else {
            this.scaling.scalingeq(this.scale,this.scale);
        }
        // Compute model matrix
        this.data.model.eq(this.sprite_matrix);
        this.data.model.composeq(this.scaling);
        this.data.model.y += this.data.model.yy;
        this.data.model.composeq(this.rotation);
        this.data.model.composeq(this.translation);
    }
    update(dt) {
        if (!this.transform_computed) {
            this.compute_transform();
            this.transform_computed = true;
        }
    }
}
