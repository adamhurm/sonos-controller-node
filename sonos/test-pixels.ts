import { DisplayTransition, Glyph, GlyphAlignment, NuimoControlDevice} from '..'
import { bootstrap, connectToDevice } from '../examples/utils'
import { digitGlyph100, digitGlyphsSmall, emptyGlyph, pauseGlyph, playGlyph, RotationMode } from '../src'
const { Sonos } = require('sonos')

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
function bannerToAnimation(banner: string[], addBuffer = false): Glyph[] {
    if (addBuffer) {
        banner = bannerAddBuffer(banner)
    }
    // N (total frames) - 9 (we have Nx9 array) + 1 (we have at least one frame)
    let frameCount = banner[0].length - 8
    let animation : Glyph[] = []
    for (let i = 0; i < frameCount; i++) {
        let frame : string[] = []
        for (let row = 0; row < 9; row++) {
            frame.push(banner[row].substring(i,i+9))
        }
        animation.push(Glyph.fromString(frame))
    }
    return animation
}

// This function converts a number to a double-digit Glyph
function numberGlyph(n: number) {
    // Only handle integers 0-100
    if ((n < 0) || (n > 100) || !Number.isInteger(n)) throw "outside of allowed range"
    // Return special "100" Glyph
    if (n == 100) { return digitGlyph100 }
    // Return combined Glyph of first and second digit
    return concatGlyph(digitGlyphsSmall[Math.floor((n/10) % 10)], digitGlyphsSmall[n % 10])
}

// This function concatenates two Glyphs, adding a space in between
function concatGlyph(a: Glyph, b: Glyph): Glyph {
    if (a.characterRows.length != b.characterRows.length) throw "Glyph heights do not match"
    let combined : string[] = []
    for (let i = 0; i < a.characterRows.length; i++) {
        combined.push(a.characterRows[i].concat(' ', b.characterRows[i]))
    }
    return Glyph.fromString(combined)
}

// This function displays the "SONOS" startup splash screen
async function startupSplash(device: NuimoControlDevice) {
    // Display beginning of animation Glyph on device
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

    // Continue sending Glyph animations to device
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

    // If there is a disconnection, cancel the animation.
    device.on('disconnect', () => {
        clearInterval(interval)
    })
    // If the display button is touched, cancel the animation.
    device.on('touch', () => {
        clearInterval(interval)
    })

}

/**
 * Main application entry point
 */
async function main() {
    // Get nuimo device and sonos speaker
    const device = await connectToDevice(DEVICE_ID)
    const speaker = new Sonos('0.0.0.0')

    await startupSplash(device)

    // Play + Pause when display button is clicked.
    device.on('select', async() => {
        // Get current speaker state and choose Glyph
        let status = await speaker.getCurrentState()
        let toggleGlyph = emptyGlyph
        if (status == "playing") {
            toggleGlyph = pauseGlyph
        }
        else if (status == "paused") {
            toggleGlyph = playGlyph
        }
        // Toggle speaker and show status Glyph display button
        speaker.togglePlayback()
        device.displayGlyph(toggleGlyph, {
                alignment: GlyphAlignment.Center,
                transition: DisplayTransition.CrossFade,
        })
        // Clear display button after 5 seconds
        await new Promise(f => setTimeout(f, 5000))
        device.displayGlyph(emptyGlyph, {
                alignment: GlyphAlignment.Center,
                transition: DisplayTransition.CrossFade,
        })
    })

    // Show current volume when display button is touched.
    device.on('touch', async() => {
        let volumeGlyph = numberGlyph(await speaker.getVolume())
        device.displayGlyph(volumeGlyph, {
                alignment: GlyphAlignment.Center,
                transition: DisplayTransition.CrossFade,
        })
        // Clear display button after 5 seconds
        await new Promise(f => setTimeout(f, 5000))
        device.displayGlyph(emptyGlyph, {
                alignment: GlyphAlignment.Center,
                transition: DisplayTransition.CrossFade,
        })
    })

    // Volume Control
    device.rotationMode = RotationMode.Clamped
    device.setRotationRange(-1, 1, 0, 2)
    device.on('rotate', async(delta, rotation) => { 
        // Linear Conversion (https://stackoverflow.com/a/929107/5024903)
        let newVolume = Math.floor(((rotation + 1) * 100) / 2)
        let volumeGlyph = numberGlyph(newVolume)
        
        speaker.setVolume(newVolume)
        
        device.displayGlyph(volumeGlyph, {
                alignment: GlyphAlignment.Center,
                transition: DisplayTransition.CrossFade,
        })
    })
}


// Boot strap async function
bootstrap(main)
