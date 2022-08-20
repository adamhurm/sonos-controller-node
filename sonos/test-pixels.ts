import { DisplayTransition, Glyph, GlyphAlignment } from '..'
import { bootstrap, connectToDevice } from '../examples/utils'

// Uncomment to search for only your device
// ENTER DEVICE_ID to discover only a particular device`
const DEVICE_ID: string | undefined = undefined

// This function creates a Glyph array for scrolling text animations.
function scroll_text(banner: string[]): Glyph[] {
    // total frames - 9 + 1 (becuase you need to have at least one frame)
    let framecount = banner[0].length - 8
    let animation = [] as Glyph[]
    for (let i = 0; i < framecount; i++) {
        let frame = []
        for (let row = 0; row < 9; row++) {
            frame.push(banner[row].substring(i,i+9))
            // console.log("Frame " + i + ", Row " + row + ": " + frame[row])
        }
        animation.push(Glyph.fromString(frame))
    }
    return animation
}

/**
 * Main application entry point
 */
async function main() {
    const device = await connectToDevice(DEVICE_ID)

    // Create a custom Glyph
    // Nuimo has a 9x9 LED display, but you only need to create what you need
    // and use `GlyphAlignment` to align the glyph
    //
    // For animated banner glyphs, I suggest adding leading and trailing whitespace.
    const sonos_string = [
        '                                           ',
        '          **   **  *   *  **   **          ',
        '         *  * *  * *   * *  * *  *         ',
        '         *    *  * **  * *  * *            ',
        '         **** *  * * * * *  * ****         ',
        '            * *  * *  ** *  *    *         ',
        '         *  * *  * *   * *  * *  *         ',
        '          **   **  *   *  **   **          ',
        '                                           '
    ]

    const animation: Glyph[] = scroll_text(sonos_string)
    device.displayGlyph(animation[0], {
                       alignment: GlyphAlignment.Center,
                       transition: DisplayTransition.CrossFade,
    })

    let i = 0
    const interval = setInterval(() => {
        // Check if the client is still connected
        if (!device.isConnected) {
            return
        }
        if (i >= animation.length) {
            i = 0
        }
        device.displayGlyph(animation[i], {
                alignment: GlyphAlignment.Center,
                transition: DisplayTransition.Immediate,
        })
        console.log(animation[i])
        i = i + 1
    }, 250)

    // If there is a disconnection, cancel the animation
    device.on('disconnect', () => {
        clearInterval(interval)
    })

    /*
    // When display button is pressed
    device.on('selectDown', () => {
        console.log('Display button presses')

        device.displayGlyph(glyph, {
            alignment: GlyphAlignment.Center,
            compositionMode: DisplayComposition.Invert,
            transition: DisplayTransition.CrossFade,
        })
    })

    // When display button is released
    device.on('selectUp', () => {
        console.log('Display button released')

        device.displayGlyph(glyph, {
            alignment: GlyphAlignment.Center,
            brightness: 0.2,
            transition: DisplayTransition.CrossFade,
        })
    })

    // When display button is pressed & released
    device.on('select', () => {
        console.log('Display button clicked')
    })
    */
}

// Boot strap async function
bootstrap(main)
