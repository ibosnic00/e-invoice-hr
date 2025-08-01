declare module 'pdf417-generator' {
    export function draw(
        code: string,
        canvas: HTMLCanvasElement,
        aspectratio?: number,
        ecl?: number,
        devicePixelRatio?: number,
        lineColor?: string
    ): void;
}