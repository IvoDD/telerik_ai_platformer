const terrainX = 8000, terrainY = 6000;
var isMouseDown = false;
var cameraX=terrainX/2, cameraY=terrainY/2;
var mx = canvas.width/terrainX, my = canvas.height/terrainY;

function draw_text(txt, x, y){
    context.fillStyle='red';
    context.font="20px Arial";
    context.fillText(txt, x*mx-context.measureText(txt).width/2, y*my);
}
function draw_from_camera(x, y, sx, sy){
    //context.fillRect(x-cameraX+canvas.width/2-sx/2, y-cameraY+canvas.height/2-sy/2, sx, sy);
    x*=mx; y*=my;
    sx*=mx; sy*=my;
    context.fillRect(x-sx/2, y-sy/2, sx, sy);
}
function drw_img(img, x, y, sx, sy, alpha){
    /*if (alpha==0){
        context.drawImage(img, x-cameraX+canvas.width/2-sx/2, y-cameraY+canvas.height/2-sy/2, sx, sy);
        return;
    }
    context.save();
    context.translate(x-cameraX+canvas.width/2, y-cameraY+canvas.height/2);
    context.rotate(alpha);
    context.drawImage(img, -sx/2, -sy/2, sx, sy);
    context.restore();*/
    x*=mx; y*=my;
    sx*=mx; sy*=my;
    if (alpha==0){
        context.drawImage(img, x-sx/2, y-sy/2, sx, sy);
        return;
    }
    context.save();
    context.translate(x, y);
    context.rotate(alpha);
    context.drawImage(img, -sx/2, -sy/2, sx, sy);
    context.restore();
    
}
function coll(obj1, obj2){
    return areColliding(
        obj1.x-obj1.sx/2, obj1.y-obj1.sy/2, obj1.sx, obj1.sy,
        obj2.x-obj2.sx/2, obj2.y-obj2.sy/2, obj2.sx, obj2.sy
    );
}
function d(x1, y1, x2, y2){
    return Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
}

class Platform{
    constructor(x, y, sx){
        this.x = x;
        this.oldx = this.x;
        this.y = y;
        this.oldy = this.y;
        this.sx = sx;
        this.sy = 40;
        this.img = new Image();
        this.img.src = 'platform.png';
    }
    move(){
        this.oldx = this.x;
        this.oldy = this.y;
    }
    draw(){
        context.fillStyle = this.color;
        drw_img(this.img, this.x, this.y, this.sx*1.2, this.sy*1.7, 0);
    }
};

class MovingPlatform extends Platform{
    constructor(x1, y1, sx, x2, y2, t){
        super(x1, y1, sx);
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.t = t;
        this.alpha = 0;
    }
    move(){
        super.move();
        this.alpha+=2/this.t*Math.PI;
        let sin = (Math.sin(this.alpha)+1)/2;
        this.x = sin*this.x1 + (1-sin)*this.x2;
        this.y = sin*this.y1 + (1-sin)*this.y2;
    }
}

var np = 200
var plats = [];
plats[0] = new Platform(terrainX/2, terrainY, terrainX);
for (let i=1; i<np; ++i){
    let x = Math.floor(Math.random()*terrainX/450)*450;
    let y = Math.floor(Math.random()*terrainY/200)*200;
    if (Math.random()<0.2)
        plats[i] = new MovingPlatform(x, y, 400, x+(Math.floor(Math.random()*3)-1)*450, y+(Math.floor(Math.random()*3)-1)*200, Math.random()*100+200);
    else
        plats[i] = new Platform(x, y, 400);
}

class Player{
    constructor(ind, name){
        this.x = Math.random()*terrainX;
        this.y = Math.random()*terrainY;
        this.sx = 40;
        this.sy = 70;
        this.color = 'blue';
        this.dy = 0;
        this.step = -1;
        this.health = 100;
        this.inv = 0;
        this.img = [new Image(), new Image(), new Image()];
        this.img_flip = [new Image(), new Image(), new Image()];
        this.img[0].src = 'hero0.png'; this.img[1].src = 'hero1.png'; this.img[2].src = 'hero2.png';
        this.img_flip[0].src = 'hero0_flipped.png'; this.img_flip[1].src = 'hero1_flipped.png'; this.img_flip[2].src = 'hero2_flipped.png';
        this.img_ind = 0;
        this.ind = ind;
        this.weapon_hold = ind;
        this.name = name;
    }
    jump(){
        if (this.health <= 0) return;
        if (this.step!=-1){
            this.dy = -12;
            this.step = -1;
        }
    }
    hit(dmg){
        if (this.health <= 0) return;
        if (this.inv == 0){
            this.health -= dmg;
            this.inv = 10;
            if (this.health%10==0){
                console.log(this.name, this.health);
            }
        }
    }
    fall(){
        if (this.step!=-1){
            this.step=-1;
            this.dy = 0;
        }
    }
    pickup(){
        let closest=1, dist=terrainX+terrainY+1000;
        for (let i=0; i<weapons.length; ++i){
            let cdist = d(this.x, this.y, weapons[i].x, weapons[i].y);
            if (cdist < dist && weapons[i].held_by==-1){
                dist = cdist;
                closest = i;
            }
        }
        if (dist < 100){
            weapons[this.weapon_hold].held_by = -1;
            this.weapon_hold = closest;
            weapons[closest].held_by = this.ind;
        }
    }
    shoot(tx, ty){
        weapons[this.weapon_hold].shoot(tx, ty);
    }
    move_left(){
        if (this.canmove){
            this.x -= 5;
            this.canmove = false;
        }
    }
    move_right(){
        if (this.canmove){
            this.x += 5;
            this.canmove=false;
        }
    }
    update(){
        this.canmove=true;
        if (this.y >= terrainY + 100) this.health=0;
        if (this.health <= 0){
            weapons[this.weapon_hold].held_by = -1;
            player[this.ind] = player[player.length-1];
            player[this.ind].ind = this.ind;
            if (this.ind < player.length-1) weapons[player[this.ind].weapon_hold].held_by = this.ind;
            player.pop();
            console.log(this.name + " has died.");
            return;
        }
        if (this.inv > 0) --this.inv;
        let oldy = this.y;
        if (this.step==-1){
            this.dy += 0.17;
            this.y += this.dy;
        }else{
            this.x += plats[this.step].x - plats[this.step].oldx;
            this.y += plats[this.step].y - plats[this.step].oldy;
        }
        if (this.step!=-1 && (this.x+this.sx/2 < plats[this.step].x-plats[this.step].sx/2 || this.x-this.sx/2 > plats[this.step].x+plats[this.step].sx/2)){
            this.step = -1;
            this.dy = 0;
        }
        for (let i=0; i<np; ++i){
            if (coll(this, plats[i]) && plats[i].oldy-oldy > this.sy/2+plats[i].sy/2){
                this.step = i;
                this.y = plats[i].y-this.sy/2-plats[i].sy/2;
            }
        }
    }
    draw(){
        if (this.health <= 0) return;
        context.fillStyle = 'rgba(0, 0, 255, 0.5)';
        draw_from_camera(this.x, this.y-this.sy/2-20, this.health, 10);
        draw_text(this.name, this.x, this.y-this.sy/2-20)
        if (this.inv%2==0) context.fillStyle = this.color;
        if (mouseX >= canvas.width/2){
            if (this.step==-1){
                drw_img(this.img[1], this.x, this.y, this.sx, this.sy, 0);
            }else{
                drw_img(this.img[Math.floor(this.img_ind/10)], this.x, this.y, this.sx, this.sy, 0);
            }
        }else{
            if (this.step==-1){
                drw_img(this.img_flip[1], this.x, this.y, this.sx, this.sy, 0);
            }else{
                drw_img(this.img_flip[Math.floor(this.img_ind/10)], this.x, this.y, this.sx, this.sy, 0);
            }
        }
    }
}

class Human extends Player{
    update(){
        super.update();
        if (isKeyPressed[65]) this.move_left()
        if (isKeyPressed[68]) this.move_right();
        cameraX = this.x;
        cameraY = this.y;
    }
}

class AI extends Player{
    update(){
        super.update();
        //indeks na vashia player e this.ind
        //vsichki indeksi sa ot 0 do player.length-1
        //playerite sa v masiv player
        this.jump();
        this.shoot(player[0].x, player[0].y);
        if (this.x < player[0].x) this.move_right();
        else this.move_left();
        //this.pickup() - pickup closest weapon
        //this.weapon_hold - ind на weapon който държиш в момента
        //weapons[0] ot ak47
        //if (weapons[0].held_by == -1 && weapons[0] instanceof AK47)
    }
}

class AI_IvoD extends Player{
    update(){
        super.update();
        if (this.movel==undefined) this.movel = false;  
        //move
        if (this.y <= terrainY-this.sy) this.fall();
        else this.jump();
        if (!(weapons[this.weapon_hold] instanceof AK47)){
            let dist = terrainX+terrainY+100;
            let closest = 0;
            for (let i=0; i<weapons.length; ++i){
                if (weapons[i] instanceof AK47 && weapons[i].held_by==-1){
                    let cdist = d(this.x, this.y, weapons[i].x, weapons[i].y);
                    if (cdist < dist){
                        closest = i;
                        dist = cdist;
                    }
                }
            }
            if (weapons[closest].x < this.x) this.move_left();
            else this.move_right();
            this.pickup();
        }else{
            if (this.x < terrainX/2){
                this.move_right();
                this.movel = false;
            }
            else if (this.x > terrainX-50){
                this.move_left();
                this.movel = true;
            }
            else{
                if (this.movel) this.move_left();
                else this.move_right();
            }
        }
        //shoot
        let highY = -1000;
        let lowest = 0;
        for (let i=0; i<player.length; ++i){
            if (i!=this.ind){
                if (player[i].y > highY){
                    highY = player[i].y;
                    lowest = i;
                }
            }
        }
        this.shoot(player[lowest].x, player[lowest].y);
    }
}

class AI_Daniel extends Player{
     constructor(ind, name) {
         super(ind, name);
         this.distance_from_players = [];
         this.distance_from_weapons = [];
         this.flag = false;
     }
     pickup(ind) {
         weapons[this.weapon_hold].held_by = -1;
         this.weapon_hold = ind;
         weapons[ind].held_by = this.ind;
     }
     ai_sort(array) {
         array.sort(function(a, b){return parseFloat(a.d) - 
parseFloat(b.d)});
     }
     update(){
         super.update();
         //indeks na vashia player e this.ind
         //vsichki indeksi sa ot 0 do player.length-1
         //playerite sa v masiv player
         if (!this.flag) {
             this.distance_from_weapons = [];
             for (let i = 0; i < weapons.length; ++i) {
                 if (weapons[i] instanceof AK47 && weapons[i].held_by == 
-1) this.distance_from_weapons.push({ind: i, d:d(this.x, this.y, 
weapons[i].x, weapons[i].y)});
             }
             this.ai_sort(this.distance_from_weapons);
             if (this.distance_from_weapons[0].d < 100) {
                 this.pickup(this.distance_from_weapons[0].ind);
                 this.flag = true;
             }
         }

         this.distance_from_players = [];
         for (let i = 0; i < player.length; ++i) {
             if (i != this.ind) this.distance_from_players.push({ind: i, 
d: d(this.x, this.y, player[i].x, player[i].y)});
         }
         this.ai_sort(this.distance_from_players);

         let a = true;
         for (let i = 0; i < this.distance_from_players.length; ++i) {
             if (player[this.distance_from_players[i].ind].inv == 0) {
this.shoot(player[this.distance_from_players[i].ind].x, 
player[this.distance_from_players[i].ind].y);
                 a = false;
                 break;
             }
         }
         if (a) this.shoot(player[this.distance_from_players[0].ind].x, 
player[this.distance_from_players[0].ind].y);

         if (!this.flag) {
             if (weapons[this.distance_from_weapons[0].ind].y < this.y) {
                 this.jump();
             } else {
                 this.fall();
             }
             if (weapons[this.distance_from_weapons[0].ind].x > this.x) {
                 this.move_right();
             } else {
                 this.move_left();
             }
         } else if (this.distance_from_players.length != 0) {
             if (player[this.distance_from_players[0].ind].y <= this.y) {
                 this.jump();
             } else if (this.y + this.sy < terrainY){
                 this.fall();
             }
             let b = true;
             let dist = 
Math.abs(player[this.distance_from_players[0].ind].x - this.x);
             if (dist >= 200) {
                 if (this.x < terrainX - 200 && 
player[this.distance_from_players[0].ind].x > this.x) {
                     this.move_right();
                 } else if (this.x > 400) {
                     this.move_left();
                 }
             }
         }
     }
}

class AI_1326 extends Player{
    update(){
        super.update();
        if (this.endLeft==undefined) this.endLeft=true;
        if (this.endRight==undefined) this.endRight=false;
        //indeks na vashia player e this.ind
        //vsichki indeksi sa ot 0 do player.length-1
        //playerite sa v masiv player
        this.jump();
        this.shoot(player[0].x, player[0].y);
        for(let i=0; i<nw; ++i){
            if(weapons[i].held_by==-1 && weapons[i] instanceof AK47){
                this.pickup();
            }
        }
        
        if(this.x<=400){
            this.endRight=false;
            this.endLeft=true;
        }
        if(this.x>=7600){
            this.endRight=true;
            this.endLeft=false;
        }
        
        if(this.endLeft==true){
            this.move_right();
        }
        if(this.endRight==true){
            this.move_left();
        }
    }
}

var kolko = 1;
var timer = 0;
var posoka = 0;
class AI_Maxim extends Player{
    update(){ 
		if(this.x>7500){
			posoka = 1;
			timer = 0;
		}
		if(this.x<350){
			posoka = 2;
			timer = 0;
		}
		var bot = Math.floor(Math.random()*player.length)
		if (bot==this.ind){
			if (bot>0) bot--;
			else bot++;
		}
		this.pickup()
		timer++
		if(timer>400){
			timer = 0
			posoka++;
		}
		if(posoka>=2) posoka = 0;
        super.update();
        //indeks na vashia player e this.ind
        //vsichki indeksi sa ot 0 do player.length-1
        //playerite sa v masiv player
		//console.log(this.health)
        this.jump();
        if (player.length > 1)this.shoot(player[bot].x, player[bot].y);
		if(posoka == 0) {
			this.move_right();
			this.jump()
		}
        if(posoka == 1) {
			this.move_left();
			this.jump()
		}
    }
}

class AI_hari extends Player {

    update() {
        try{
        super.update();
        //this.closestnew=463263287;
        if (this.blizostaro == undefined) {
            this.blizostaro = 1000000;
            this.blizost=1;
        }

        //indeks na vashia player e this.ind
        //vsichki indeksi sa ot 0 do player.length-1
        //playerite sa v masiv player
        //  console.log(player.length-1);
        //this.id=0;
        //let nsh

        let closest = 1, dist = terrainX + terrainY + 1000;
        for (let i = 0; i < weapons.length; ++i) {
            let cdist = d(this.x, this.y, weapons[i].x, weapons[i].y);
            if (cdist < dist && weapons[i].held_by == -1) {
                dist = cdist;
                this.oruj = i;
            }
        }
        if (weapons[dist] instanceof AK47) {

            this.pickup();
        }
        
        
        for (let asd = 0; asd < player.length; asd++) {

            if (asd != this.ind) {
                this.blizonovo = d(this.x, this.y, player[asd].x, player[asd].y);
                if (this.blizonovo < this.blizostaro) {
                    this.blizostaro = this.blizonovo;
                    this.blizost = asd;
                   // console.log(this.blizost);
                    
                }
            }
        }

        // console.log(this.id);
        if (this.step != -1) {
            this.kude = Math.floor(Math.random() * 2);
        }
        if (this.kude == 0 && this.y <= terrainY - 500) {

            this.fall();
        } else {
            this.jump();
        }
        this.shoot(player[this.blizost].x, player[this.blizost].y);
        if (this.x < player[this.blizost].x) this.move_right();
        else this.move_left();
    }catch(e){
        this.health=0;
    }
    }

}

class AI_Martin extends Player{
    update(){
        super.update();
        for(let i=0; i<player.length-1; i++){
            this.shoot(player[i].x, player[i].y);
        }
        if((weapons[this.weapon_hold] instanceof AK47)){
            for(let i=0; i<player.length-1; i++){
                        this.jump();
                if(i!=this.ind){
   
  
                    if(this.x > 0 && this.x < terrainX - this.sx){
                        if (this.x <= player[i].x) this.move_right();
                        else this.move_left();
                    }
                }
            }
        }else{
            this.pickup();
            for(let i=0; i<nw; i++){
                if(weapons[i].x >= this.x){
                   this.move_right();
                }else{
                    this.move_left();
                }
                if(weapons[i].y > this.y){
                   this.jump();
                }else{
                    this.fall();
                }
            }
        }
    }  
}

class AI_Martin_A extends Player {

    update() {
        try{
         cameraX = this.x;
        cameraY = this.y;
        super.update();

        //this.closestnew=463263287;
        if (this.closestnew == undefined) {
            this.closestnew = 1000000;
            this.id=1;
        }

        //indeks na vashia player e this.ind
        //vsichki indeksi sa ot 0 do player.length-1
        //playerite sa v masiv player
        //  console.log(player.length-1);
        //this.id=0;
        //let nsh

        let closest = 1, dist = terrainX + terrainY + 1000;
        for (let i = 0; i < weapons.length; ++i) {
            let cdist = d(this.x, this.y, weapons[i].x, weapons[i].y);
            if (cdist < dist && weapons[i].held_by == -1) {
                dist = cdist;
                this.asdd = i;
            }
        }
        if (weapons[dist] instanceof AK47) {

            this.pickup();
        }
        
        
        for (let asd = 0; asd < player.length; asd++) {

            if (asd != this.ind) {
                
                
                this.closestold = d(this.x, this.y, player[asd].x, player[asd].y);
                if (this.closestold < this.closestnew) {
                    this.closestnew = this.closestold;
                    this.id = asd;
                    //console.log(this.id);
                    
                }
            }
        }

        // console.log(this.id);
        if (this.step != -1) {
            this.kude = Math.floor(Math.random() * 2);
        }
        if (this.kude == 0 && this.y <= terrainY - 500) {

            this.fall();
        } else {
            this.jump();
        }
        this.shoot(player[this.id].x, player[this.id].y);
        if (this.x < player[this.id].x) this.move_right();
        else this.move_left();
    }catch(e){
        this.health=0;
    }
    }

}

class AI_Misho extends Player{
    update(){
        super.update();
        //indeks na vashia player e this.ind
        //vsichki indeksi sa ot 0 do player.length-1
        //playerite sa v masiv player
        this.pickup();
        var g = Math.floor(Math.random()*2+1);
        var k = Math.floor(Math.random()*5+1); 
        let i = Math.floor(Math.random()*player.length);
        let p = Math.floor(Math.random()*terrainX-4500);
        this.move_left;
        if(this.x<p){this.move_right();}
        this.shoot(player[i].x-g, player[i].y-g);
        var uod = Math.floor(Math.random()*3+1);
        if(uod==1){
            this.jump();
        }
        if(uod==3 || uod ==2){
            this.fall;
        }
        let closest=1, dist=terrainX+terrainY+1000;
        for (let i=0; i<weapons.length; ++i){
            let cdist = d(this.x, this.y, weapons[i].x, weapons[i].y);
            if (cdist < dist && weapons[i].held_by==-1){
                dist = cdist;
                closest = i;
            }
        }
        if(weapons[closest] instanceof AK47){
            this.pickup();
        }
    }
}

class AI_Azis extends Player{
    update(){
        super.update();
        if(Math.floor(Math.random()*2)==1){
           
           this.jump()
           }else{
            this.fall()
           }
       
       
       if(this.x == cameraX && this.y == cameraY){
          this.dmg= 1000
       }
        //indeks na vashia player e this.ind
        //vsichki indeksi sa ot 0 do player.length-1
        //playerite sa v masiv player
        
        
        
       this.shoot(player[0].x, player[0].y);
        if (this.x < player[0].x) this.move_right();
       else this.move_left();
       if(weapons[2].held_by == -1 && weapons[2] instanceof AK47){
          this.pickup()
       }
    }
}

class SimeonR_AI extends Player{
    update(){
        super.update();
        //indeks na vashia player e this.ind
        //vsichki indeksi sa ot 0 do player.length-1
        //playerite sa v masiv player
        for (let i = 0; i < player.length - 1; ++i){
            let  cdist = d(this.x, this.y, player[i].x, player[i].y);
            let dist = 10000000;
            if (cdist < dist){
                dist = cdist;
                this.shoot(player[i].x, player[i].y);
            }
        };
 
        if ( !(weapons[this.weapon_hold] instanceof AK47)){
            let dist = 10000000;
            let closest=0
            for (let i = 0; i < nw; ++i){
                if (weapons[i].held_by == -1 && weapons[i] instanceof AK47){
                    let cdist = d(this.x, this.y, weapons[i].x, weapons[i].y)
                    if (cdist < dist){
                        dist = cdist;
                        closest = i;
                    }
                }
            }
            //let i = 7;
            if (weapons[closest].held_by == -1 && weapons[closest] instanceof AK47) this.pickup();
                    if (this.y > weapons[closest].y){
                        this.jump();
                    }else{
                        this.fall();
                    }
                    if (this.x > weapons[closest].x){
                        this.move_left();
                    }else{
                        this.move_right();
                    }
        }
        if (weapons[this.weapon_hold] instanceof AK47){
            let t = 0
            ++t
            if (t % 5 == 0){
                if (this.x > 100) this.move_left();
                if (this.y > 100) this.jump()
            } else{
                if (this.x < terrainX - 100) this.move_right();
                if (this.y < terrainY - 100) this.fall()
            }
        }
            
        }
}

var posoka_oriel=-5;
var k_oriel=0;
var l_oriel=0;

class AI_Oriel extends Player{
    update(){
        //console.log(this.x)
        super.update();
       k_oriel++;
        l_oriel++;
        this.pickup();
        if(k_oriel>=300){
        if(Math.random()>0.5){
           this.posoka_oriel=5;
        }else{
            this.posoka_oriel=-5;
        }
         k_oriel=0;
        }
        if(l_oriel>=100){
        if(Math.random()>0.5){
        this.jump();
        }else{
            
        }
           l_oriel=0;
        }
        if(posoka_oriel==-5){
        
            this.move_right();
        
        }
            if(posoka_oriel==5){
        this.move_left();
            
        
            }
        //this.x+=this.posoka_oriel;
        for(var i=0;i<player.length;i++){
            if(player[i].health>0 && player[i]!= AI_Oriel){
        this.shoot(player[i].x, player[i].y);
        }else{
            i++;
        }
        }
    }
}
            
var player = [new Human(0, 'player'), new AI_IvoD(1, 'IvoD'), new AI_Daniel(2, 'DanielR'), new AI_1326(3, '1326'), new AI_Maxim(4, 'MaximH'), new AI_hari(5, 'hari'), new AI_Martin(6, 'MartinR'), new AI_Martin_A(7, 'MartinA'), new AI_Misho(8, 'MishoG'), new AI_Azis(9, 'Azis'), new SimeonR_AI(10, 'SimeonR'), new AI_Oriel(11, 'Oriel')];

var bullets = [];
class Bullet{
    constructor(x, y, sx, sy, targetX, targetY, speed, dmg, img, ind, shot_by){
        this.x = x;
        this.y = y;
        this.sx = sx;
        this.sy = sy;
        let dist = d(x, y, targetX, targetY);
        //console.log("dist", dist)
        this.dx = (targetX-x)/dist*speed;
        this.dy = (targetY-y)/dist*speed;
        this.alpha = Math.atan2(this.dy, this.dx);
        this.speed = speed;
        this.img = new Image();
        this.img.src = img;
        this.dmg = dmg;
        this.ind = ind;
        this.shot_by = shot_by;
    }
    del(){
        bullets[this.ind] = bullets[bullets.length-1];
        bullets[this.ind].ind = this.ind;
        bullets.pop();
    }
    update(){
        this.x+=this.dx;
        this.y+=this.dy;
        if (this.x > terrainX+canvas.width ||
           this.x < -canvas.width ||
           this.y > terrainY+canvas.height ||
           this.y < -canvas.height){
            this.del();
            return;
        }
        for (let i=0; i<player.length; ++i){
            if (coll(this, player[i]) && i!=this.shot_by){
                player[i].hit(this.dmg);
                this.del();
                return;
            }
        }
    }
    draw(){
        drw_img(this.img, this.x, this.y, this.sx, this.sy, this.alpha);
    }
}

class Weapon{
    constructor(x, y, held_by=-1){
        this.x = x;
        this.y = y;
        this.sx = 50;
        this.sy = 50;
        this.img = new Image();
        this.img.src = 'pistol.png';
        this.img_flip = new Image();
        this.img_flip.src = 'pistol_flip.png';
        this.held_by = held_by;
        this.reaload_time = 30;
        this.curr_reload = 0;
        this.dirX = 100;
        this.dirY = 0;
        this.alpha = 0;
    }
    update(){
        if (this.held_by != -1 && player[this.held_by] != undefined){
            if (this.curr_reload > 0) --this.curr_reload;
            this.y = player[this.held_by].y;
            if (mouseX-canvas.width/2+cameraX > player.x)
                this.x = player[this.held_by].x+10;
            else                
                this.x = player[this.held_by].x-10;
        }
    }
    shoot(tx, ty){
        if (this.held_by != -1 && this.curr_reload==0){
            bullets.push(new Bullet(this.x, this.y, 20, 10, tx, ty, 10, 2, 'bullet.png', bullets.length, this.held_by));
            this.curr_reload = this.reaload_time;
        }
        if (this.held_by != -1){
            this.dirX=tx-this.x
            this.dirY=ty-this.y
            this.alpha = Math.atan2(this.dirY, this.dirX);
        }
    }
    draw(){
        if (this.dirX >= 0) drw_img(this.img, this.x, this.y, this.sx, this.sy, this.alpha);
        else drw_img(this.img_flip, this.x, this.y, this.sx, this.sy, this.alpha);
    }
}

class AK47 extends Weapon{
    constructor(x, y, held_by=-1){
        super(x, y, held_by);
        this.img.src = 'ak47.png';
        this.img_flip.src = 'ak47_flip.png';
        this.reaload_time = 5;
    }
}

var nw = 100;
var weapons = [];
for (let i=0; i<player.length; ++i){
    weapons[i] = new Weapon(player[i].x, player[i].y, i);
}
for (let i=player.length; i<nw; ++i){
    weapons[i] = new AK47(Math.random()*terrainX, Math.random()*terrainY);
}

function update() {
    for (let i=0; i<np; ++i){
        plats[i].move();
    }
    for (let i=0; i<player.length; ++i){
        player[i].update();
    }
    for (let i=0; i<weapons.length; ++i){
        weapons[i].update();
    }
    if (isMouseDown) player[0].shoot(mouseX+cameraX-canvas.width/2, mouseY+cameraY-canvas.height/2);
    for (let i=0; i<bullets.length; ++i){
        bullets[i].update();
    }
}

var background = new Image();
background.src = 'background.jpg'

function draw() {
    //context.drawImage(background, -cameraX/terrainX*canvas.width, -cameraY/terrainY*canvas.height, canvas.width*2, canvas.height*2);
    context.drawImage(background, 0, 0, canvas.width, canvas.height);
    for (let i=0; i<np; ++i){
        plats[i].draw();
    }
    for (let i=0; i<player.length; ++i){
        player[i].draw();
    }
    for (let i=0; i<nw; ++i){
        weapons[i].draw();
    }
    for (let i=0; i<bullets.length; ++i){
        bullets[i].draw();
    }
};

function keydown(key) {
    if (key==32) player[0].jump();
    if (key==83) player[0].fall();
    if (key==69) player[0].pickup();
};
function mousedown(){
    isMouseDown=true;
}
function mouseup() {
    isMouseDown=false;
};
