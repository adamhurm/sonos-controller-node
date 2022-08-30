import { DisplayTransition, Glyph, GlyphAlignment } from '..'
import { NuimoControlDevice } from '..'
import { bootstrap, connectToDevice } from '../examples/utils'

// Uncomment to search for only your device
// ENTER DEVICE_ID to discover only a particular device`
const DEVICE_ID: string | undefined = undefined

function banner_buffer(banner: string[]) {
    console.log("banner_buffer stub")
}

// This function creates a Glyph array for scrolling text animations.
// TODO: Create function to add buffer to beginning and end of Glyph for clean transition.
function banner_to_animation(banner: string[], add_buffer = true): Glyph[] {
    if (add_buffer) {
        banner_buffer(banner)
    }
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


async function startup_splash(device: NuimoControlDevice) {
    // Create a custom Glyph
    // Nuimo has a 9x9 LED display
        // You only need to create what you need
    // and use `GlyphAlignment` to align the glyph
    //
    // In order to use scrolling banners larger than 9x9,
    // send your Nx9 string to scroll_text(example_banner_string)
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

    const animation: Glyph[] = banner_to_animation(sonos_string)
    device.displayGlyph(animation[0], {
                       alignment: GlyphAlignment.Center,
                       transition: DisplayTransition.CrossFade,
    })

    let banner_frame = 0
    const interval = setInterval(() => {
        // Check if the client is still connected
        if (!device.isConnected) {
            return
        }
        /* // Loop animation
        if (banner_frame >= animation.length) {
                banner_frame = 0
        }
        */
        // Stop animation after one cycle
        // TODO: Add whitespace buffer to banner automatically
        if (banner_frame >= animation.length) {
            return
        }
        device.displayGlyph(animation[banner_frame], {
                alignment: GlyphAlignment.Center,
                transition: DisplayTransition.Immediate,
        })
        banner_frame++
    }, 250)

    // If there is a disconnection, cancel the animation
    device.on('disconnect', () => {
        clearInterval(interval)
    })

}

/**
 * Main application entry point
 */
async function main() {
    const device = await connectToDevice(DEVICE_ID)

    await startup_splash(device)
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
