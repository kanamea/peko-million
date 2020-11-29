import * as PIXI from 'pixi.js'
import Database from './database.js'

class MainMessagePage {
    // enum containing every flag and unicode

    // enum of states
    static States = Object.freeze({
        main: "main",
        pekomon_select: "pekomon_select",
        art_view: "art_view",
        loading: "loading"
    })

    static AnimationStates = Object.freeze({
        none: "none",
        moving_pekomon: "moving_pekomon"
    })

    static #max_cooldown = 100

    static #msgs = []
    static #sprites = new Map()
    static #state = this.States.main
    static #cooldown = Math.floor(Math.random() * this.#max_cooldown)
    static #counter = 0
    static #width
    static #height
    static #speech_bubbles = []
    static #pekomons = []
    static #animation_state = this.AnimationStates.none
    static #is_drag
    static #start_drag_x
    static #initial_pekora
    static #offset_drag_x
    static #msg_index
    static #clicked
    static base_width = 1920
    static base_height = 1080
    static #scrollable = true
    static #message_up
    static #message_down
    static #type = "orig"
    static #app
    static #scroll

    // initialize page
    static async #initialize(app) {
        // get the data necessary from the database
        this.#msgs = await Database.get_messages({})
        this.#state = this.States.loading
        this.#is_drag = false

        this.#width = app.renderer.width
        this.#height = app.renderer.height

        this.#app = app

        let img_src = [
            './profile/Africa.png',
            './profile/Central America.png',
            './profile/Central Asia.png',
            './profile/East Asia.png',
            './profile/Europe & North Asia.png',
            './profile/None.png',
            './profile/North America.png',
            './profile/Oceania.png',
            './profile/South America.png',
            './profile/South Asia.png',
            './profile/South East Asia.png',
            './profile/West Asia.png',
            './profile/twitter.png',
            './profile/translate_grey.png',
            './profile/translate.png',
            './profile/default_ava.png'
        ]

        let img_basic = [
            './img/pekora.json',
            './img/pekomon.json',
            './img/pekomon_hl.json'
        ]

        this.#msgs.forEach((el) => {
            if (el.has_avatar === 0) {
                img_src.push(el.avatar)
            }

            if (el.has_fan_art === 0) {
                img_src.push(el.fan_art)
            }
        })

        return new Promise((resolve, reject) => {
            app.loader.add(img_basic).load((loader, resource) => {
                loader.add(img_src).load((l, r) => {
                    this.#state = this.States.main
                })
                this.#sprites = new Map()
                this.#scroll = new Map()

                const edge_height = this.#height / 50
                const field_height = this.#height * .25 - edge_height

                // create bunnies
                this.#draw_bunnies();

                // create ground animation
                this.#draw_field(field_height, edge_height)

                // create button boxes
                let org = this.#create_buttons(this.#width / 4, this.#width / 36, this.#width / 16 * 7 - this.#width / 30, this.#height / 3 * 2,
                    ["Organize"],
                    [
                        () => {
                            this.#sprites.get("organize").visible = false
                            this.#sprites.get("sort").visible = true
                        }
                    ]
                )
                this.#sprites.set("organize", org)

                let sort = this.#create_buttons(this.#width / 4, this.#width / 36, this.#width / 16 * 7 - this.#width / 30, this.#height / 3 * 2,
                    ["Sort by:", "Name", "Region", "Fan Art", "Unread", "Random"],
                    [
                        () => {},
                        () => {
                            this.sort_by(1)

                            this.#animation_state = this.AnimationStates.moving_pekomon
                            this.#state = this.States.pekomon_select
                            this.#sprites.get("sort").visible = false
                            this.#sprites.get("pekomons_name").forEach((el) => {
                                el.visible = true
                            })
                        },
                        () => {
                            this.sort_by(2)

                            this.#animation_state = this.AnimationStates.moving_pekomon
                            this.#state = this.States.pekomon_select
                            this.#sprites.get("sort").visible = false
                            this.#sprites.get("pekomons_name").forEach((el) => {
                                el.visible = true
                            })
                        },
                        () => {
                            this.sort_by(3)

                            this.#animation_state = this.AnimationStates.moving_pekomon
                            this.#state = this.States.pekomon_select
                            this.#sprites.get("sort").visible = false
                            this.#sprites.get("pekomons_name").forEach((el) => {
                                el.visible = true
                            })
                        },
                        () => {
                            this.sort_by(4)

                            this.#animation_state = this.AnimationStates.moving_pekomon
                            this.#state = this.States.pekomon_select
                            this.#sprites.get("sort").visible = false
                            this.#sprites.get("pekomons_name").forEach((el) => {
                                el.visible = true
                            })
                        },
                        () => {
                            this.sort_by(5)

                            this.#animation_state = this.AnimationStates.moving_pekomon
                            this.#state = this.States.pekomon_select
                            this.#sprites.get("sort").visible = false
                            this.#sprites.get("pekomons_name").forEach((el) => {
                                el.visible = true
                            })
                        },
                    ]
                )

                this.#sprites.set("sort", sort)

                // create pekora sprite animation
                this.#draw_pekora(edge_height)

                // create pekomon sprite animation
                this.#draw_pekomon(app)

                // add them to stage
                this.#sprites.forEach((element) => {
                    if (!Array.isArray(element)) {
                        app.stage.addChild(element)
                    } else {
                        app.stage.addChild(...element)
                    }
                })

                // event handlers
                // drag
                window.onpointerdown = (event) => {
                    this.#start_drag_x = event.pageX
                    this.#initial_pekora = this.#sprites.get("pekora").x
                    this.#offset_drag_x = 0
                    this.#is_drag = true
                }

                window.onpointerup = () => {
                    this.#is_drag = false
                    this.#sprites.get("pekora").scale.x = Math.abs(this.#sprites.get("pekora").scale.x)
                }

                window.onpointermove = (event) => {
                    this.#offset_drag_x = event.pageX - this.#start_drag_x
                    if (this.#state === this.States.pekomon_select) {
                        this.#animation_state = this.AnimationStates.moving_pekomon
                    }
                }

                window.onkeydown = (event) => {
                    // update index if left/right is pressed

                    if (this.#clicked) {
                        if (event.keyCode === 37) {
                            this.#msg_index = (((this.#msg_index + 1) % this.#pekomons.length) + this.#pekomons.length) % this.#pekomons.length
                            this.#pekomons[this.#msg_index].sprite.pointertap()
                            return
                        }

                        if (event.keyCode === 39) {
                            this.#msg_index = (((this.#msg_index - 1) % this.#pekomons.length) + this.#pekomons.length) % this.#pekomons.length
                            this.#pekomons[this.#msg_index].sprite.pointertap()
                            return
                        }

                        let scroll = this.#scroll.get(this.#pekomons[this.#msg_index].info.id)

                        if (event.keyCode === 38 && scroll[0].visible) {
                            scroll[0].pointertap()
                            return
                        }

                        if (event.keyCode === 40 && scroll[1].visible) {
                            scroll[1].pointertap()
                            return
                        }
                    }
                }

                // frame event
                app.ticker.add(async () => {
                    // move rabbit icon
                    this.#sprites.get("bunnies").children.forEach((el) => {
                        let amt_x = 6
                        let amt_y = 7

                        let x_dist = this.#width / (amt_x - 1)
                        let y_dist = this.#height / (amt_y - 1)

                        if (el.y <= -y_dist) {
                            el.y = this.#height + y_dist
                        } else {
                            el.y -= 1
                        }

                        if (el.x <= -x_dist) {
                            el.x = this.#width + x_dist
                        } else {
                            el.x -= 1.5
                        }
                    })

                    for (let i = 0; i < this.#speech_bubbles.length; i++) {
                        let element = this.#speech_bubbles[i]

                        if (element.sprite.alpha > 0 && element.stage === 2) {
                            element.sprite.alpha -= .01
                        }

                        if (element.sprite.alpha === 0 && element.stage === 2) {
                            this.#speech_bubbles.splice(i, 1)
                            element.destroy()
                            i--
                        }
                    }

                    if (this.#is_drag && this.#state == this.States.pekomon_select) {
                        this.#sprites.get("pekora").x = this.#initial_pekora + this.#offset_drag_x
                    }

                    if (this.#counter >= this.#cooldown && this.#state === this.States.main) {
                        this.#cooldown = Math.random() * this.#max_cooldown
                        this.#counter = 0

                        // create a thread just drawing the bubble and killing itself after few few seconds
                        new Promise(async (resolve, reject) => {
                            let spr = this.#draw_messages(this.#pekomons[Math.floor(Math.random() * this.#msgs.length)])

                            let ind = this.#speech_bubbles.push({
                                sprite: spr,
                                stage: 1
                            }) - 1

                            app.stage.addChild(this.#speech_bubbles[ind].sprite)

                            await new Promise((r, rej) => {setTimeout(r, 500)})

                            this.#speech_bubbles[ind].stage = 2

                            resolve()
                        })
                    }

                    if (this.#animation_state === this.AnimationStates.moving_pekomon) {
                        let count = 0

                        this.#pekomons.forEach((el, i) => {
                            let dest_x = this.#sprites.get("pekora").x - (i + 1) * 200.0 - 200;
                            let dest_y = this.#sprites.get("pekora").y
                            let angle = Math.tan(Math.abs(dest_y - el.sprite.y) / Math.abs(dest_x - el.sprite.x))
                            let velocity = 100

                            if (Math.abs(el.sprite.x - dest_x) >= Math.cos(angle) * velocity) {
                                if (el.sprite.x > dest_x) {
                                    el.sprite.x -= Math.cos(angle) * velocity
                                    el.sprite_hl.x = el.sprite.x
                                    el.sprite_name.x = el.sprite.x
                                } else {
                                    el.sprite.x += Math.cos(angle) * velocity
                                    el.sprite_hl.x = el.sprite.x
                                    el.sprite_name.x = el.sprite.x
                                }
                            } else {
                                el.sprite.x = dest_x
                                el.sprite_hl.x = el.sprite.x
                                el.sprite_name.x = el.sprite.x
                            }

                            if (Math.abs(el.sprite.y - dest_y) >= Math.sin(angle) * velocity) {
                                if (el.sprite.y > dest_y) {
                                    el.sprite.y -= Math.sin(angle) * velocity
                                    el.sprite_hl.y = el.sprite.y
                                    el.sprite_name.y = el.sprite.y
                                } else {
                                    el.sprite.y += Math.sin(angle) * velocity
                                    el.sprite_hl.y = el.sprite.y
                                    el.sprite_name.y = el.sprite.y
                                }
                            }
                            else {
                                el.sprite.y = dest_y
                                el.sprite_hl.y = el.sprite.y
                                el.sprite_name.y = el.sprite.y
                            }

                            if (i === this.#msg_index) {
                                this.#sprites.get("detailed_message").x = el.sprite.x
                            }

                            if (el.sprite.x === dest_x && el.sprite.y === dest_y) {
                                count++
                            }
                        })

                        if (count == this.#pekomons.length) {
                            this.#animation_state = this.AnimationStates.none
                        }
                    }

                    if (this.#state === this.States.main) {
                        this.#counter++
                    } else {
                        this.#counter = 0
                    }
                })
            })

            

            resolve()
        })
    }

    static #draw_bunnies() {
        let bunnies = new PIXI.Container();

        let amt_x = 6
        let amt_y = 7

        let x_dist = this.#width / (amt_x - 1)
        let y_dist = this.#height / (amt_y - 1)

        amt_x += 1
        amt_y += 1

        let x_shifter = x_dist / 2

        let rabbit_color = 0xFFA657

        for (let i = 0; i < amt_x * amt_y; i++) {
            let x_i = i % amt_x
            let y_i = Math.trunc(i / amt_x)

            let face = new PIXI.Graphics()

            let radius_face = 50
            let radius_long_ear = radius_face
            let radius_short_ear = radius_face / 2.5
            let arc_angle = Math.PI / 12

            face.beginFill(rabbit_color)
            face.drawCircle(radius_face / 2, radius_face / 2, radius_face)
            face.endFill()

            let ear1 = new PIXI.Graphics()
            ear1.beginFill(rabbit_color)
            ear1.drawEllipse(0, 0, radius_short_ear, radius_long_ear)
            ear1.endFill()

            ear1.x = Math.cos(-arc_angle - Math.PI / 2) * radius_face + radius_short_ear / 2
            ear1.y = Math.sin(-arc_angle - Math.PI / 2) * radius_face + radius_long_ear / 2
            ear1.rotation -= arc_angle / 2

            let ear2 = new PIXI.Graphics()
            ear2.beginFill(rabbit_color)
            ear2.drawEllipse(0, 0, radius_short_ear, radius_long_ear)
            ear2.endFill()

            ear2.x = Math.cos(Math.PI + arc_angle + Math.PI / 2) * radius_face + radius_short_ear * 2
            ear2.y = Math.sin(Math.PI + arc_angle + Math.PI / 2) * radius_face + radius_long_ear / 2
            ear2.rotation += arc_angle / 2

            let bunny = new PIXI.Container()
            bunny.addChild(face)
            bunny.addChild(ear1)
            bunny.addChild(ear2)

            bunny.x = x_i * x_dist + (y_i % 2 == 0 ? x_shifter : 0)
            bunny.y = y_i * y_dist
            bunny.scale.x = this.#height / this.base_height
            bunny.scale.y = this.#height / this.base_height

            bunnies.addChild(bunny)
        }

        this.#sprites.set("bunnies", bunnies)
    }

    static #draw_field(field_height, edge_height) {
        let field = new PIXI.Graphics()

        field.beginFill(0x4cb3cf)
        field.drawRect(0, field_height * this.#height / this.base_height, this.#width, edge_height * this.#height / this.base_height)
        field.endFill()
        field.beginFill(0x56dbff)
        field.drawRect(0, 0, this.#width, field_height * this.#height / this.base_height)
        field.endFill()
        field.beginFill(0xFFFFFF, .3)
        field.drawPolygon([
            0, 0,
            field_height * this.#height / this.base_height + this.#width / 6, 0,
            this.#width / 6, field_height * this.#height / this.base_height,
            0, field_height * this.#height / this.base_height
        ])
        field.endFill()

        field.y = this.#height - edge_height * this.#height / this.base_height - field_height * this.#height / this.base_height

        this.#sprites.set("field", field)
    }

    static #draw_pekora(edge_height) {
        let frames_pekora = []

        for (let i = 0; i < 10; i++){
            const texture = PIXI.Texture.from(`pekora${i}.png`)
            frames_pekora.push(texture)
        }

        const pekora = new PIXI.AnimatedSprite(frames_pekora)

        // setup the position of Pekora
        pekora.x = this.#width / 8 * 7
        pekora.y = this.#height - edge_height - this.#height / 30
        pekora.zIndex = pekora.y + 1

        pekora.anchor.x = .5
        pekora.anchor.y = 1

        // scale Pekora based on height. Pekora should be roughly x the height
        const scale_amount = (this.#height * .4) / pekora.height
        pekora.scale.y = scale_amount
        pekora.scale.x = scale_amount

        // Rotate around the center
        pekora.animationSpeed = .16
        pekora.play()

        pekora.resize = () => {
            pekora.x = this.#width / 8 * 7
            pekora.y = this.#height - edge_height - this.#height / 30

            scale_amount = (this.#height * .4) / pekora.height
            pekora.scale.y = scale_amount
            pekora.scale.x = scale_amount
        }

        this.#sprites.set("pekora", pekora)
    }

    static #draw_pekomon(app) {
        // define a function to rotate array so Pekomon will start animation at different frame
        let rotate = function(arr, k) {
            return arr.slice(k, arr.length).concat(arr.slice(0, k))
        }

        // define a function for Pekomon's y, which is sine over certain range. Adjust the amplitude over time with cubic easing in function. Apply absolute value to avoid negatives
        let func_y = (t, max_dev) => {
            return Math.abs(Math.sin(t * Math.PI * 4) * (max_dev - (max_dev * (t*t))))
        }

        let frames_pekomon = []
        let frames_pekomon_hl = []

        const pekora = this.#sprites.get("pekora")

        for (let i = 0; i < 10; i++) {
            const texture = PIXI.Texture.from(`pekomon${i}.png`)
            const texture2 = PIXI.Texture.from(`pekomon_hl${i}.png`)
            frames_pekomon.push(texture)
            frames_pekomon_hl.push(texture2)
        }

        const pekomons = []

        this.#msgs.forEach((element, i) => {
            const ind_offset = Math.floor(Math.random() * frames_pekomon.length)
            
            const pekomon = new PIXI.AnimatedSprite(rotate(frames_pekomon, ind_offset))

            // get random x
            pekomon.x = Math.floor(Math.random() * (pekora.x - this.#width / 30)) - this.#width / 30

            // get t, a proportion between max width and current x
            let t = pekomon.x / (pekora.x - this.#width / 30)

            // calculate the y based on the function
            let dev = func_y(t, this.#height / 4)
            pekomon.y = pekora.y - Math.floor(Math.random() * dev)

            pekomon.anchor.x = .5
            pekomon.anchor.y = 1

            // scale the same amount as Pekora
            pekomon.scale.y = pekora.scale.y / 1.5
            pekomon.scale.x = pekora.scale.x / 1.5
            pekomon.animationSpeed = .16
            pekomon.interactive = true
            pekomon.play()

            pekomon.zIndex = pekomon.y

            // create highlight sprites
            const pekomon_hl = new PIXI.AnimatedSprite(rotate(frames_pekomon_hl, ind_offset))
            
            pekomon_hl.x = pekomon.x
            pekomon_hl.y = pekomon.y
            pekomon_hl.anchor.x = pekomon.anchor.x
            pekomon_hl.anchor.y = pekomon.anchor.y
            pekomon_hl.scale.y = pekomon.scale.y
            pekomon_hl.scale.x = pekomon.scale.x
            pekomon_hl.animationSpeed = pekomon.animationSpeed
            pekomon_hl.alpha = 0
            pekomon_hl.zIndex = pekomon_hl.y
            pekomon_hl.play()

            let text_style = new PIXI.TextStyle({
                fontFamily: "Courier",
                fontSize: 15 * (this.#width / this.base_width),
                fill: 0xFFFFFF
            })

            const pekomon_name_plate = new PIXI.Container()
            const pekomon_name_text = new PIXI.Text(MainMessagePage.wrap(element.name, 20), text_style)

            let height = pekomon_name_text.height * 1.5
            let width = pekomon_name_text.width + height
            
            const pekomon_name_bg = new PIXI.Graphics()
            pekomon_name_bg.beginFill(0x333333)
            pekomon_name_bg.drawRoundedRect(0, 0, width, height, height / 2)
            pekomon_name_bg.endFill()

            pekomon_name_bg.pivot.x = width / 2
            pekomon_name_bg.pivot.y = height / 2

            pekomon_name_text.pivot.x = pekomon_name_text.width / 2
            pekomon_name_text.pivot.y = pekomon_name_text.height / 2

            pekomon_name_plate.addChild(pekomon_name_bg)
            pekomon_name_plate.addChild(pekomon_name_text)

            pekomon_name_plate.x = pekomon.x
            pekomon_name_plate.y = pekomon.y

            pekomon_name_plate.visible = false

            // mouse-over, change the texture from regular pekora to highlight pekora
            pekomon.pointerover = () => {
                switch (this.#state) {
                    case this.States.main:
                        this.#sprites.get("pekomons_hl").forEach((el) => {
                            el.alpha = 1
                        })
                        break
                    case this.States.pekomon_select:
                        pekomon_hl.alpha = 1
                        break
                }
            }

            pekomon.pointerout = () => {
                switch (this.#state) {
                    case this.States.main:
                        this.#sprites.get("pekomons_hl").forEach((el) => {
                            el.alpha = 0
                        })
                        break
                    case this.States.pekomon_select:
                        if (this.#msg_index === null || this.#msg_index === undefined || pekomon !== this.#pekomons[this.#msg_index].sprite) {
                            pekomon_hl.alpha = 0
                        }
                        break
                }
            }

            pekomon.pointertap = () => {
                switch (this.#state) {
                    case this.States.main:
                        this.#sprites.get("organize").visible = true
                        break
                    case this.States.pekomon_select:
                        this.#pekomons.forEach((el) => {
                            if (el.sprite_hl !== pekomon_hl) {
                                el.sprite_hl.alpha = 0
                            }
                        })

                        // get current index
                        let index = -1
                        this.#pekomons.forEach((el, ind) => {
                            if (el.info.id === element.id) {
                                index = ind
                            }
                        })

                        if (this.#sprites.get("detailed_message") !== null && this.#sprites.get("detailed_message") !== undefined) {
                            this.#sprites.get("detailed_message").destroy()
                        }

                        this.#sprites.get("pekora").x = this.#width / 8 * 4 + (index + 2) * 200.0;
                        this.#animation_state = this.AnimationStates.moving_pekomon

                        this.#clicked = true

                        let spr = this.#draw_detailed_message(element, 900 * (this.#width / this.base_width), 600 * (this.#width / this.base_width), pekomon.x, this.#height / 32 * 25)
                        this.#pekomons[index].detail_message = spr

                        pekomon_hl.alpha = 1
                        this.#msg_index = index
                        this.#sprites.set("detailed_message", this.#pekomons[index].detail_message)
                        app.stage.addChild(spr)
                        break
                }
            }

            pekomons.push({
                info: element,
                sprite: pekomon,
                sprite_hl: pekomon_hl,
                sprite_name: pekomon_name_plate
            })
        })

        this.#pekomons = pekomons
        this.#sprites.set("pekomons", [])
        this.#sprites.set("pekomons_hl", [])
        this.#sprites.set("pekomons_name", [])
        pekomons.forEach((element) => {
            this.#sprites.get("pekomons").push(element.sprite)
            this.#sprites.get("pekomons_hl").push(element.sprite_hl)
            this.#sprites.get("pekomons_name").push(element.sprite_name)
        })
    }

    static #draw_messages(pekomon_data) {
        let info = pekomon_data.info
        let sprite = pekomon_data.sprite

        let info_msg = MainMessagePage.wrap(info.message.substring(0, 400) + "\n        ...", 20)
        let info_name = MainMessagePage.wrap(info.name, 15)
        let width = 200 * (this.#width / this.base_width)

        // draw text
        let text_style1 = new PIXI.TextStyle({
            fontFamily: "Courier",
            fontSize: 15 * (this.#width / this.base_width),
            fill: 0x000000
        })

        let message_text = new PIXI.Text(info_msg, text_style1)

        let text_style2 = new PIXI.TextStyle({
            fontFamily: "Courier",
            fontSize: 15 * (this.#width / this.base_width),
            fill: 0xFFFFFF
        })

        let name_text = new PIXI.Text(info_name, text_style2)

        name_text.pivot.x = 0
        name_text.pivot.y = name_text.height

        name_text.x = sprite.x - width / 2
        name_text.y = sprite.y - sprite.height - message_text.height - 35 - name_text.height
        
        message_text.pivot.x = message_text.width / 2
        message_text.pivot.y = 0

        message_text.x = sprite.x
        message_text.y = sprite.y - sprite.height - message_text.height - 45 - name_text.height + 20

        let height = message_text.height + 30

        // draw message box
        let message_box = new PIXI.Graphics()
        message_box.lineStyle(2, 0x000000)

        // main message box
        message_box.beginFill(0xFFFFFF)
        message_box.drawRoundedRect(0, 0, width, height, 5)
        message_box.endFill()

        // name box
        message_box.beginFill(0x333333)
        message_box.drawRoundedRect(-10, -12 - name_text.height + 10, name_text.width + 22, name_text.height + 12, 10)
        message_box.endFill()

        // down arrow
        message_box.beginFill(0xFFFFFF)
        message_box.drawPolygon([
            width / 2 - 5, height,
            width / 2 + 5, height,
            width / 2, height + 5
        ])
        message_box.endFill()

        message_box.pivot.x = width / 2
        message_box.pivot.y = message_box.height

        message_box.x = sprite.x
        message_box.y = sprite.y - sprite.height

        let cont = new PIXI.Container()
        cont.addChild(message_box)
        cont.addChild(message_text)
        cont.addChild(name_text)
        cont.zIndex = Number.MAX_SAFE_INTEGER - 2

        return cont
    }

    static #create_buttons(width, button_height, x, y, buttons, click_event) {
        const height = button_height * buttons.length

        // draw message box
        let button_bg = new PIXI.Graphics()

        // main message box
        button_bg.beginFill(0x222222, 1)
        button_bg.drawRect(0, 0, width, height)
        button_bg.endFill()

        // down arrow
        button_bg.beginFill(0x222222, 1)
        button_bg.drawPolygon([
            width / 2 - 10, height,
            width / 2 + 10, height,
            width / 2, height + 10
        ])
        button_bg.endFill()

        button_bg.pivot.x = width / 2
        button_bg.pivot.y = height + 10

        let button_sprites = []

        buttons.forEach((el, i) => {
            let text_style1 = new PIXI.TextStyle({
                fontFamily: "Courier",
                fontSize: 30 * this.#width / this.base_width,
                fill: 0xFFFFFF
            })
            let text_style2 = new PIXI.TextStyle({
                fontFamily: "Courier",
                fontSize: 30 * this.#width / this.base_width,
                fill: 0x000000
            })

            let bg_hl = new PIXI.Graphics()
            let text = new PIXI.Text(el, text_style1)
            let text_hl = new PIXI.Text(el, text_style2)

            bg_hl.beginFill(0xCCCCCC, 1)
            bg_hl.drawRect(0, 0, width, button_height)
            bg_hl.endFill()

            bg_hl.pivot.x = width / 2
            bg_hl.pivot.y = button_height / 2

            text.pivot.x = text.width / 2
            text.pivot.y = text.height / 2

            text_hl.pivot.x = text.width / 2
            text_hl.pivot.y = text.height / 2

            bg_hl.visible = false
            text_hl.visible = false

            let individual_button = new PIXI.Container()
            individual_button.addChild(bg_hl)
            individual_button.addChild(text)
            individual_button.addChild(text_hl)

            individual_button.interactive = true
            individual_button.pointerover = () => {
                bg_hl.visible = true
                text_hl.visible = true
            }
            individual_button.pointerout = () => {
                bg_hl.visible = false
                text_hl.visible = false
            }
            individual_button.pointertap = click_event[i]

            individual_button.x = 0
            individual_button.y = button_height * (i-buttons.length +1) - button_height / 2 - 10

            button_sprites.push(individual_button)
        })

        let button = new PIXI.Container()

        button.x = x
        button.y = y

        button.visible = false

        button.zIndex = Number.MAX_SAFE_INTEGER - 1

        button.addChild(button_bg)
        button.addChild(...button_sprites)

        return button
    }

    static #draw_detailed_message = (info, width, height, x, y) => {
        let info_msg = MainMessagePage.wrap(info.message, 33)
        let info_msg_alt = info.alt_message !== null ? MainMessagePage.wrap(info.alt_message, 33) : ""

        let message = new PIXI.Graphics();

        let arrow_width = 20
        let arrow_height = 10

        // box shadow
        message.beginFill(0x000000, .5)
        message.drawRect(5, 5, width, height)
        message.drawPolygon([
            width / 12 * 5 - arrow_width / 2 + 5, height + 5,
            width / 12 * 5 + arrow_width / 2 + 5, height + 5,
            width / 12 * 5 + arrow_width / 8 * 5 + 5, height + arrow_height + 5
        ])
        message.endFill()

        // box
        message.beginFill(0xFEFEFE)
        message.drawRect(0, 0, width/2, height)
        message.endFill()

        message.beginFill(0xFFA657)
        message.drawRect(width/2, 0, width/2, height)
        message.endFill()

        // down arrow
        message.beginFill(0xFEFEFE)
        message.drawPolygon([
            width / 12 * 5 - arrow_width / 2, height,
            width / 12 * 5 + arrow_width / 2, height,
            width / 12 * 5 + arrow_width / 8 * 5, height + arrow_height
        ])
        message.endFill()
        message.beginFill(0x000000, .3)
        message.drawPolygon([
            width / 12 * 5 - arrow_width / 2, height,
            width / 12 * 5 + arrow_width / 2, height,
            width / 12 * 5 + arrow_width / 8 * 5, height + arrow_height
        ])
        message.endFill()

        // avatar
        let name_width = width / 3 * 2
        let name_height = height / 8

        message.beginFill(0x000000, .5)
        message.drawCircle(5, 5, name_height / 2)
        message.drawRoundedRect(-name_height / 2 + 5, -name_height / 2 + 5, name_width + name_height / 2, name_height / 4 * 3, name_height / 2)
        message.endFill()

        message.beginFill(0xFFA657)
        message.drawCircle(0, 0, name_height / 2)
        message.drawRoundedRect(-name_height / 2, -name_height / 2, name_width + name_height / 2, name_height / 4 * 3, name_height / 2)
        message.endFill()

        let img = info.has_avatar === 0 ? info.avatar : `./profile/default_ava.png`

        let avatar_texture = PIXI.Texture.from(img)
        let avatar = new PIXI.Sprite(avatar_texture)
        let avatar_mask = new PIXI.Graphics()

        avatar_mask.beginFill(0xFFFFFF)
        avatar_mask.drawCircle(0, 0, name_height / 2 - name_height / 16)
        avatar_mask.endFill()

        avatar.mask = avatar_mask

        avatar.anchor.x = .5
        avatar.anchor.y = .5

        avatar.scale.x = name_height / avatar.width
        avatar.scale.y = name_height / avatar.height

        // name
        let text_style1 = new PIXI.TextStyle({
            fontFamily: "Courier",
            fontSize: 20 * (this.#width / this.base_width),
            fill: 0xFFFFFF
        })

        let name = new PIXI.Text(info.name, text_style1)

        name.anchor.y = .5
        name.x = name_height / 2 + name_height / 10
        name.y = -name_height / 8

        // message
        let text_style2 = new PIXI.TextStyle({
            fontFamily: "Courier",
            fontSize: 20 * (this.#width / this.base_width),
            fill: 0x000000
        })

        let message_content_orig = new PIXI.Text(info_msg, text_style2)
        let message_content_alt = new PIXI.Text(info_msg_alt, text_style2)

        let message_mask = new PIXI.Graphics()

        message_mask.beginFill(0xFFFFFF)
        message_mask.drawRect(0, height / 13 * 1.5 + height / 32, width/2, height - (height / 13 * 1.5 + height / 32) * 2)
        message_mask.endFill()

        message_content_orig.mask = message_mask

        message_content_orig.anchor.x = .5
        message_content_orig.anchor.y = 1

        message_content_orig.x = width / 4
        message_content_orig.y = height / 13 * 1.5 + height / 32 + message_content_orig.height

        message_content_alt.mask = message_mask

        message_content_alt.anchor.x = .5
        message_content_alt.anchor.y = 1

        message_content_alt.x = width / 4
        message_content_alt.y = height / 13 * 1.5 + height / 32 + message_content_alt.height

        message_content_alt.visible = false

        // message scroll up
        let message_up = new PIXI.Graphics()
        let arr_width = 4 * this.#width / this.base_height
        let top_y =  height / 13 * 1.5 + height / 32 + message_content_orig.height
        let content_height = message_mask.height

        message_up.beginFill(0x000000, .5)
        message_up.drawRect(7, 7, width/2 - 10, height / 16 - 10)
        message_up.endFill()

        message_up.beginFill(0xFFA657)
        message_up.drawRect(5, 5, width/2 - 10, height / 16 - 10)
        message_up.endFill()

        message_up.beginFill(0xFEFEFE)
        message_up.drawRect(7, 7, width/2 - 14, height/16 - 14)
        message_up.endFill()

        message_up.beginFill(0x000000)
        message_up.drawPolygon([
            width/4 - 5, height / 32 + 2.5 - arr_width / 2,
            width/4, height / 32 - 2.5 - arr_width / 2,
            width/4 + 5, height / 32 + 2.5 - arr_width / 2,
            width/4 + 5, height / 32 + 2.5 + arr_width / 2,
            width/4, height / 32 - 2.5 + arr_width / 2,
            width/4 - 5, height / 32 + 2.5 + arr_width / 2
        ])
        message_up.endFill()

        message_up.pivot.x = width / 4
        message_up.pivot.y = height / 32

        message_up.x = width / 4
        message_up.y = height / 13 * 1.5

        let message_down = new PIXI.Graphics()

        message_down.beginFill(0x000000, .5)
        message_down.drawRect(7, 7, width/2 - 10, height / 16 - 10)
        message_down.endFill()

        message_down.beginFill(0xFFA657)
        message_down.drawRect(5, 5, width/2 - 10, height / 16 - 10)
        message_down.endFill()

        message_down.beginFill(0xFEFEFE)
        message_down.drawRect(7, 7, width/2 - 14, height/16 - 14)
        message_down.endFill()

        message_down.beginFill(0x000000)
        message_down.drawPolygon([
            width/4 - 5, height / 32 - 2.5 - arr_width / 2,
            width/4, height / 32 + 2.5 - arr_width / 2,
            width/4 + 5, height / 32 - 2.5 - arr_width / 2,
            width/4 + 5, height / 32 - 2.5 + arr_width / 2,
            width/4, height / 32 + 2.5 + arr_width / 2,
            width/4 - 5, height / 32 - 2.5 + arr_width / 2
        ])
        message_down.endFill()

        message_down.pivot.x = width / 4
        message_down.pivot.y = height / 32

        message_down.x = width / 4
        message_down.y = height - height / 13 * 1.5

        this.#scroll.set(info.id, [message_up, message_down])

        if (message_content_orig.height > message_mask.height) {
            message_up.interactive = true
            message_down.interactive = true

            message_up.pointertap = () => {
                let offset = 20
                let content = null

                if (this.#type === "orig") {
                    content = message_content_orig
                } else {
                    content = message_content_alt
                }

                if (content.y < top_y + content_height * .5 - offset) {
                    message_down.visible = true
                    content.y += offset
                } else {
                    content.y = top_y + content_height * .5
                    message_up.visible = false
                }
            }

            message_down.pointertap = () => {
                let offset = 20
                let content = null

                if (this.#type === "orig") {
                    content = message_content_orig
                } else {
                    content = message_content_alt
                }

                if (content.y > top_y - content.height + content_height * .5 + offset) {
                    message_up.visible = true
                    content.y -= 20
                } else {
                    content.y = top_y - content.height + content_height * .5
                    message_down.visible = false
                }
            }

            this.#scrollable = true
            this.#message_up = message_up
            this.#message_down = message_down
        } else {
            message_up.visible = false
            message_down.visible = false

            this.#scrollable = false
        }

        // art
        img = info.has_fan_art === 0 ? info.fan_art : "./profile/default_ava.png"

        let art_texture = PIXI.Texture.from(img)
        let art = new PIXI.Sprite(art_texture)
        let art_bg = new PIXI.Graphics()

        let art_margin = height / 16
        let art_bg_width = width / 2 - art_margin * 2
        let art_bg_height = 9/16.0 * art_bg_width

        // shadow
        art_bg.beginFill(0x000000, .5)
        art_bg.drawRect(0 + 5, 0 + 5, art_bg_width, art_bg_height)
        art_bg.endFill()

        art_bg.beginFill(0xFEFEFE)
        art_bg.drawRect(0, 0, art_bg_width, art_bg_height)
        art_bg.endFill()

        let line_width = 2
        let art_margin2 = art_bg.height / 32
        let active_width = art_bg_width - art_margin2 * 2 - line_width * 2
        let active_height = art_bg_height - art_margin2 * 2 - line_width * 2

        art_bg.beginFill(0xFFA657)
        art_bg.drawRect(art_margin2, art_margin2, art_bg_width - art_margin2 * 2, art_bg_height - art_margin2 * 2)
        art_bg.endFill()

        art_bg.beginFill(0xFEFEFE)
        art_bg.drawRect(art_margin2 + line_width, art_margin2 + line_width, active_width, active_height)
        art_bg.endFill()

        let asp_desire = active_width / active_height
        let asp_art = art.width / art.height
        let scale = null

        // aspect ratio is higher on width, scale based on the width, otherwise, scale based on height
        if (asp_art > asp_desire) {
            scale = active_width / art.width
        } else {
            scale = active_height / art.height
        }

        art.scale.x = scale
        art.scale.y = scale

        art.anchor.x = .5
        art_bg.pivot.x = art_bg_width / 2

        art.x = width / 4 * 3
        art_bg.x = width / 4 * 3

        art.visible = info.has_fan_art === 0

        if (art.visible) {
            art_bg.interactive = true
            art_bg.pointertap = () => {
                if (this.#state !== this.States.art_view) {
                    this.#state = this.States.art_view
                    MainMessagePage.draw_art(art_texture)
                }
            }
        }

        // region
        let map_texture = PIXI.Texture.from(`./profile/${info.region}.png`)
        let map = new PIXI.Sprite(map_texture)
        let map_bg = new PIXI.Graphics()

        let map_scale = art_bg.width / map.width

        map.scale.x = map_scale
        map.scale.y = map_scale

        map.anchor.x = .5

        map.x = width / 4 * 3

        map_bg.beginFill(0x000000, .5)
        map_bg.drawRect(0, 0, map.width, map.height)
        map_bg.endFill()

        map_bg.pivot.x = map.width / 2

        map_bg.x = map.x + 5

        // twitter
        let icon_cnt = 2
        let interval = (width / 2 - art_margin * 2) / (icon_cnt + 1)

        let icon_container = new PIXI.Container()

        let icon_bg = new PIXI.Graphics()

        icon_bg.beginFill(0xFFFFFF, .3)
        icon_bg.drawRoundedRect(0, 0, width / 2 - art_margin * 2, height / 10, 20 * (this.#width / this.base_width))
        icon_bg.endFill()

        icon_container.addChild(icon_bg)

        let twitter_cont = new PIXI.Container();
        let twitter_texture = PIXI.Texture.from('./profile/twitter.png')
        let twitter_icon = new PIXI.Sprite(twitter_texture)
        let twitter_mask = new PIXI.Graphics()
        let twitter_shadow = new PIXI.Graphics()

        twitter_icon.anchor.x = .5
        twitter_icon.anchor.y = .5

        twitter_icon.scale.x = (height / 10 - 5) / twitter_icon.width
        twitter_icon.scale.y = (height / 10 - 5) / twitter_icon.height

        twitter_mask.beginFill(0xFFFFFF)
        twitter_mask.drawCircle(0, 0, height / 20 - 5)
        twitter_mask.endFill()

        twitter_icon.mask = twitter_mask

        twitter_shadow.beginFill(0x000000, .5)
        twitter_shadow.drawCircle(2, 2, height / 20 - 5)
        twitter_shadow.endFill()

        twitter_cont.addChild(twitter_shadow)
        twitter_cont.addChild(twitter_icon)
        twitter_cont.addChild(twitter_mask)

        if (info.has_twitter !== 0) {
            let unavailable = new PIXI.Graphics()

            unavailable.beginFill(0xFF2222)
            unavailable.drawRect(-height / 20 - 5, -4, height / 10 + 10, 3)
            unavailable.drawRect(-height / 20 - 5, 4, height / 10 + 10, 3)
            unavailable.endFill()

            twitter_cont.addChild(unavailable)
        }

        twitter_cont.x = interval * 1
        twitter_cont.y = height / 20

        twitter_cont.interactive = info.has_twitter === 0
        twitter_cont.pointertap = () => {
            let wind = window.open(info.twitter)
            wind.focus()
        }

        twitter_cont.pointerover = () => {
            twitter_cont.scale.x = twitter_cont.scale.x * 1.2
            twitter_cont.scale.y = twitter_cont.scale.y * 1.2
        }

        twitter_cont.pointerout = () => {
            twitter_cont.scale.x = twitter_cont.scale.x / 1.2
            twitter_cont.scale.y = twitter_cont.scale.y / 1.2
        }

        let translate_cont = new PIXI.Container();
        let translate_texture = PIXI.Texture.from("./profile/translate.png")
        let translate_texture_grey = PIXI.Texture.from("./profile/translate_grey.png")
        let translate_icon = new PIXI.Sprite(translate_texture_grey)
        let translate_bg = new PIXI.Graphics()

        translate_icon.anchor.x = .5
        translate_icon.anchor.y = .5

        translate_icon.scale.x = (height / 10 - 5) / translate_icon.width
        translate_icon.scale.y = (height / 10 - 5) / translate_icon.height

        translate_bg.beginFill(0x000000, .5)
        translate_bg.drawRoundedRect(2, 2, height / 10 - 5, height / 10 - 5, 10)
        translate_bg.endFill()

        translate_bg.beginFill(0xFFFFFF)
        translate_bg.drawRoundedRect(0, 0, height / 10 - 5, height / 10 - 5, 10)
        translate_bg.endFill()

        translate_bg.pivot.x = (height / 10 - 5) / 2
        translate_bg.pivot.y = (height / 10 - 5) / 2

        translate_cont.addChild(translate_bg)
        translate_cont.addChild(translate_icon)

        if (info.alt_message === null) {
            let unavailable = new PIXI.Graphics()

            unavailable.beginFill(0xFF2222)
            unavailable.drawRect(-height / 20 - 5, -4, height / 10 + 10, 3)
            unavailable.drawRect(-height / 20 - 5, 4, height / 10 + 10, 3)
            unavailable.endFill()

            translate_cont.addChild(unavailable)
        }

        translate_cont.x = interval * 2
        translate_cont.y = height / 20

        translate_cont.interactive = info.alt_message !== null
        translate_cont.pointerover = () => {
            translate_cont.scale.x = translate_cont.scale.x * 1.2
            translate_cont.scale.y = translate_cont.scale.y * 1.2
        }

        translate_cont.pointerout = () => {
            translate_cont.scale.x = translate_cont.scale.x / 1.2
            translate_cont.scale.y = translate_cont.scale.y / 1.2
        }

        translate_cont.pointertap = () => {
            if (translate_icon.texture === translate_texture) {
                translate_icon.texture = translate_texture_grey
                this.#type = "orig"
                message_content_alt.visible = false
                message_content_orig.visible = true
                message_content_orig.y = height / 13 * 1.5 + height / 32 + message_content_orig.height
            } else {
                translate_icon.texture = translate_texture
                this.#type = "alt"
                message_content_alt.visible = true
                message_content_orig.visible = false
                message_content_alt.y = height / 13 * 1.5 + height / 32 + message_content_alt.height
            }
        }

        icon_container.addChild(twitter_cont)
        icon_container.addChild(translate_cont)

        icon_container.pivot.x = width / 4 - art_margin
        icon_container.x = width / 4 * 3

        let total_height = height - art_margin * 2
        let occupied_height = art_bg.height + map.height + icon_container.height + 5
        let total_left_over = total_height - occupied_height
        let intervals = total_left_over / 2
        
        art.y = art_margin + art_margin2 + line_width
        art_bg.y = art_margin
        map.y = art_bg.y + art_bg.height + intervals
        map_bg.y = map.y + 5
        icon_container.y = map_bg.y + map.height + intervals

        let container = new PIXI.Container()

        container.addChild(message)
        container.addChild(avatar_mask)
        container.addChild(avatar)
        container.addChild(name)
        container.addChild(message_mask)
        container.addChild(message_content_orig)
        container.addChild(message_content_alt)
        container.addChild(message_up)
        container.addChild(message_down)
        container.addChild(art_bg)
        container.addChild(art)
        container.addChild(map_bg)
        container.addChild(map)
        container.addChild(icon_container)

        container.pivot.x = width / 2
        container.pivot.y = height

        container.x = x
        container.y = y

        return container
    }

    static draw_art(art_texture) {
        let bg_shadow = new PIXI.Graphics()
        let bg_del = new PIXI.Graphics()
        let bg = new PIXI.Graphics()
        let art = new PIXI.Sprite(art_texture)
        let cont = new PIXI.Container()

        let sc = this.#width / this.base_width

        let border = 50 * sc
        let hl_line = 5 * sc

        let active_width = this.#width - border * 2 - 40 - hl_line * 2
        let active_height = this.#height - border * 2 - 40 - hl_line * 2

        bg_shadow.beginFill(0x000000, .8)
        bg_shadow.drawRect(-5, -5, this.#width + 10, this.#height + 10)
        bg_shadow.endFill()

        bg_shadow.beginHole()
        bg_shadow.drawRect(border, border, this.#width - border * 2, this.#height - border * 2)
        bg_shadow.endHole()

        bg_del.beginFill(0xFFFFFF)
        bg_del.drawCircle(0, 0, 25 * sc)
        bg_del.endFill()

        bg_del.beginFill(0x000000)
        bg_del.drawRect(-15 * sc, -1.5 * sc, 30 * sc, 3 * sc)
        bg_del.drawRect(-1.5 * sc, -15 * sc, 3 * sc, 30 * sc)
        bg_del.endFill()

        bg_del.angle = 45

        bg_del.x = this.#width - border
        bg_del.y = border

        bg.beginFill(0xFFFFFF)
        bg.drawRect(border, border, this.#width - border * 2, this.#height - border * 2)
        bg.endFill()

        bg.beginFill(0xFFA657)
        bg.drawRect(border + 20, border + 20, this.#width - border * 2 - 40, this.#height - border * 2 - 40)
        bg.endFill()

        bg.beginFill(0xFFFFFF)
        bg.drawRect(border + 20 + hl_line, border + 20 + hl_line, active_width, active_height)
        bg.endFill()

        let asp_art = art.width / art.height
        let asp_desire = active_width / active_height
        let scale = null
        // aspect ratio is higher on width, scale based on the width, otherwise, scale based on height
        if (asp_art > asp_desire) {
            scale = active_width / art.width
        } else {
            scale = active_height / art.height
        }

        art.scale.x = scale
        art.scale.y = scale

        art.anchor.x = .5
        art.anchor.y = .5

        art.x = this.#width / 2
        art.y = this.#height / 2

        bg_shadow.interactive = true
        bg_shadow.pointertap = () => {
            this.#sprites.get("art").destroy()
            this.#state = this.States.pekomon_select
        }

        bg_del.interactive = true
        bg_del.pointertap = () => {
            this.#sprites.get("art").destroy()
            this.#state = this.States.pekomon_select
        }

        cont.addChild(bg_shadow)
        cont.addChild(bg)
        cont.addChild(bg_del)
        cont.addChild(art)

        cont.zIndex = Math.MAX_SAFE_INTEGER

        this.#sprites.set("art", cont)
        this.#app.stage.addChild(cont)
    }

    static wrap(text, width) {
        let new_text = ""

        let cnt = 0

        let byteSize = (str) => new Blob([str]).size;
        for (const c of text) {
            cnt += byteSize(c) > 1 ? 2 : 1

            if (cnt >= width && c !== "\n") {
                new_text += "\n"
                cnt = 0
            } else if (c === "\n") {
                cnt = 0
            }

            new_text += c
        }

        return new_text
    }

    static sort_by(type) {
        switch(type) {
        // sort by name
        case 1:
            this.#pekomons.sort((a, b) => {
                return a.info.name.localeCompare(b.info.name)
            })
            break
        // sort by region
        case 2:
            this.#pekomons.sort((a, b) => {
                if (a.info.region === b.info.region) {
                    return 0
                }

                if (a.info.region === "None") {
                    return 1
                }

                if (b.info.region === "None") {
                    return -1
                }
                
                return a.info.region.localeCompare(b.info.region)
            })
            break
        // sort by fan art
        case 3:
            this.#pekomons.sort((a, b) => {
                if (a.info.has_fan_art === b.info.has_fan_art) {
                    return 0
                }

                if (a.info.has_fan_art === 0) {
                    return -1
                }

                if (b.info.has_fan_art === 0) {
                    return 1
                }

                return 0
            })
            break
        // sort by read
        case 4:
            this.#pekomons.sort((a, b) => {
                if (a.info.has_fan_art === b.info.has_fan_art) {
                    return 0
                }

                if (a.info.read) {
                    return 1
                }

                if (b.info.read) {
                    return -1
                }
            })
            break
        // sort by random
        case 5:
            for (var i = this.#pekomons.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var temp = this.#pekomons[i];
                this.#pekomons[i] = this.#pekomons[j];
                this.#pekomons[j] = temp;
            }
            break
        }
    }

    // run the page
    static async run(app) {
        await this.#initialize(app)
    }
}

export default MainMessagePage