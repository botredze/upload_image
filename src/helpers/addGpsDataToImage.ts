/* External dependencies */
import sharp from "sharp";

export async function addGpsDataToImage (
    content: Buffer | any,
    latitude: number,
    longitude: number,
    altitude: number,
    accuracy: number) {

    const image = sharp(content);
    const metadata = await image.metadata();

    const text = `Latitude: ${latitude.toFixed(
        6)}\nLongitude: ${longitude.toFixed(6)}\nAltitude:
         ${altitude.toFixed(2)} m\nAccuracy: 
         ${accuracy.toFixed(2)} m`;

    const textOptions = {
        font: 'Arial',
        fontSize: 16,
        fill: '#ffffff',
        background: { r: 0, g: 0, b: 0, alpha: 0.5 },
        gravity: 'southwest',
        padding: 10,
    };

    const overlayBuffer = await sharp(Buffer.from(text))
        .resize({ width: metadata.width })
        .toBuffer();

    const compositeBuffer = await image
        .composite([{ input: overlayBuffer, gravity: textOptions.gravity }])
        .toBuffer();

    return compositeBuffer;
}