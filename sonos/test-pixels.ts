import { DisplayTransition, Glyph, GlyphAlignment, NuimoControlDevice} from '..'
import { bootstrap, connectToDevice, logEvent } from '../examples/utils'
import { digitGlyphsSmall, emptyGlyph, RotationMode } from '../src'

// Uncomment to search for only your device
// ENTER DEVICE_ID to discover only a particular device`
const DEVICE_ID: string | undefined = undefined

// This function adds a buffer to the beginning and end of a Nx9 Glyph
function bannerAddBuffer(banner: string[]) {
    // return Glyph if it is not 9x9
    if (banner.length != 9) {
        return banner
    }
    let newBanner : string[] = []
    for (let i = 0; i < banner.length; i++) {
	let newBannerLine : string = ' '.repeat(9) + banner[i] + ' '.repeat(9)
	newBanner[i] = newBannerLine
    }
    return newBanner
}

// This function creates a Glyph array for scrolling text animations.
// TODO: Create function to add buffer to beginning and end of Glyph for clean transition.
function bannerToAnimation(banner: string[], addBuffer = false): Glyph[] {
    if (addBuffer) {
        banner = bannerAddBuffer(banner)
    }
    // total frames - 9 + 1 (becuase you need to have at least one frame)
    let frameCount = banner[0].length - 8
    let animation : Glyph[] = []
    for (let i = 0; i < frameCount; i++) {
        let frame : string[] = []
        for (let row = 0; row < 9; row++) {
            frame.push(banner[row].substring(i,i+9))
            // console.log("Frame " + i + ", Row " + row + ": " + frame[row])
        }
        animation.push(Glyph.fromString(frame))
    }
    return animation
}


function numberGlyph(n: number) {
    if ((n < 0) || (n > 100) || !Number.isInteger(n)) throw "outside of allowed range"
    return concatGlyph(digitGlyphsSmall[Math.floor((n/10) % 10)], digitGlyphsSmall[n % 10])
}

// This function concatenates two Glyphs, adding a space in between
function concatGlyph(a: Glyph, b: Glyph): Glyph {
    /*
     * assert(a.characterRows.length === b.characterRows.length)
     * assert(a.characterRows[0].length === b.characterRows[0].length)
     */
    let combined = []
    for (let i = 0; i < a.characterRows.length; i++) {
        combined.push(a.characterRows[i].concat(' ',b.characterRows[i]))
    }
    return Glyph.fromString(combined)
}

// This function displays the "SONOS" startup splash screen
async function startupSplash(device: NuimoControlDevice) {
    // Create a custom 9x9 Glyph for Nuimo LED display
    // You only need to create what you need
    // and use `GlyphAlignment` to align the glyph
    //
    // In order to use scrolling banners longer than 9x9,
    // send your Nx9 string to scroll_text(example_banner_string)
    //
    // For animated banner glyphs,
    // add_buffer will add leading and trailing spaces
    const sonosString : string[] = [
        '                         ',
        ' **   **  *   *  **   ** ',
        '*  * *  * *   * *  * *  *',
        '*    *  * **  * *  * *   ',
        '**** *  * * * * *  * ****',
        '   * *  * *  ** *  *    *',
        '*  * *  * *   * *  * *  *',
        ' **   **  *   *  **   ** ',
        '                         '
    ]

    const animation: Glyph[] = bannerToAnimation(sonosString, true)
    device.displayGlyph(animation[0], {
                       alignment: GlyphAlignment.Center,
                       transition: DisplayTransition.CrossFade,
    })

    let bannerFrame = 0
    const interval = setInterval(() => {
        // Check if the client is still connected
        if (!device.isConnected) {
            return
        }
        /* // Loop animation
        if (bannerFrame >= animation.length) {
                bannerFrame = 0
        } */
        // Stop animation after one cycle
        if (bannerFrame >= animation.length) {
            return
        }
        device.displayGlyph(animation[bannerFrame], {
                alignment: GlyphAlignment.Center,
                transition: DisplayTransition.Immediate,
        })
        bannerFrame++
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

    await startupSplash(device)

    /*
    const volumeGlyph = Glyph.fromString([
        ' **   ** ',
        '*  * *  *',
        '*  * *  *',
        '*  * *  *',
        '*  * *  *',
        '*  * *  *',
        ' **   ** '
    ])
    */

    const volumeGlyph = numberGlyph(87) 

    // Show current volume when display button is pressed & released.
    device.on('select', async() => {
        device.displayGlyph(volumeGlyph, {
                alignment: GlyphAlignment.Center,
                transition: DisplayTransition.CrossFade,
        })
	await new Promise(f => setTimeout(f, 5000))
        device.displayGlyph(emptyGlyph, {
                alignment: GlyphAlignment.Center,
                transition: DisplayTransition.CrossFade,
        })
    })
    
    // Set the rotation mode to clamp, ensuring the rotation stops at a min/max value for us
    device.rotationMode = RotationMode.Clamped

    // When using clamped rotation you may set the min/max values using setRotationRange
    // In this example the range is from -1 to 1, starting at 0 (mid-range)
    // The final value represents the number of rotation cycles it takes between the min and max. By default
    // this is the spread of the max-min (2 in this example). For example, this is set to 2 (1 positive and 1 negative rotation)
    device.setRotationRange(-1, 1, 0, 1)

    /*
    // Rotation in any direction
    device.on('rotate', (delta, rotation) => {
        logEvent('rotate', {
            delta,
            rotation,
        })
    })
    */

    // Direction specific rotations
    device.on('rotateLeft', (delta, rotation) => {
        logEvent('rotateLeft', {
            delta,
            rotation,
        })
    })
    device.on('rotateRight', (delta, rotation) => {
        logEvent('rotateRight', {
            delta,
            rotation,
        })
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
