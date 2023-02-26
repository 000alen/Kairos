import React from "react";
import { interpolateRainbow } from "d3-scale-chromatic";
import { Zoom } from "@visx/zoom";
import { localPoint } from "@visx/event";
import { RectClipPath } from "@visx/clip-path";
import genPhyllotaxis, {
    GenPhyllotaxisFunction,
    PhyllotaxisPoint
} from "@visx/mock-data/lib/generators/genPhyllotaxis";
import { scaleLinear } from "@visx/scale";

const bg = "#0a0a0a";
const points = [...new Array(1000)];

const colorScale = scaleLinear<number>({ range: [0, 1], domain: [0, 1000] });
const sizeScale = scaleLinear<number>({ domain: [0, 600], range: [0.5, 8] });

const initialTransform = {
    scaleX: 1.27,
    scaleY: 1.27,
    translateX: -211.62,
    translateY: 162.59,
    skewX: 0,
    skewY: 0
};

export type ZoomIProps = {
    width: number;
    height: number;
};

export default function ZoomI({ width, height }: ZoomIProps) {
    const generator: GenPhyllotaxisFunction = genPhyllotaxis({
        radius: 10,
        width,
        height
    });
    const phyllotaxis: PhyllotaxisPoint[] = points.map((d, i) => generator(i));

    return (
        <>
            <Zoom<SVGSVGElement>
                width={width}
                height={height}
                scaleXMin={1 / 2}
                scaleXMax={4}
                scaleYMin={1 / 2}
                scaleYMax={4}
                initialTransformMatrix={initialTransform}
            >
                {(zoom) => (
                    <svg
                        width={width}
                        height={height}
                        style={{
                            cursor: zoom.isDragging ? "grabbing" : "grab",
                            touchAction: "none"
                        }}
                        ref={zoom.containerRef}
                    >
                        <RectClipPath id="zoom-clip" width={width} height={height} />
                        
                        <rect width={width} height={height} rx={14} fill={bg} />
                        
                        <g transform={zoom.toString()}>
                            {phyllotaxis.map(({ x, y }, i) => (
                                <React.Fragment key={`dot-${i}`}>
                                    <circle
                                        cx={x}
                                        cy={y}
                                        r={i > 500 ? sizeScale(1000 - i) : sizeScale(i)}
                                        fill={interpolateRainbow(colorScale(i) ?? 0)}
                                    />
                                </React.Fragment>
                            ))}
                        </g>

                        <rect
                            width={width}
                            height={height}
                            rx={14}
                            fill="transparent"
                            onTouchStart={zoom.dragStart}
                            onTouchMove={zoom.dragMove}
                            onTouchEnd={zoom.dragEnd}
                            onMouseDown={zoom.dragStart}
                            onMouseMove={zoom.dragMove}
                            onMouseUp={zoom.dragEnd}
                            onMouseLeave={() => {
                                if (zoom.isDragging) zoom.dragEnd();
                            }}
                            onDoubleClick={(event) => {
                                const point = localPoint(event) || { x: 0, y: 0 };
                                zoom.scale({ scaleX: 1.1, scaleY: 1.1, point });
                            }}
                        />
                    </svg>
                )}
            </Zoom>
        </>
    );
}
