import React, { useMemo, useCallback } from 'react';
import { Group } from '@visx/group';
import { Circle } from '@visx/shape';
import { scaleLinear } from '@visx/scale';
import { withTooltip, Tooltip } from '@visx/tooltip';
import { WithTooltipProvidedProps } from '@visx/tooltip/lib/enhancers/withTooltip';
import { voronoi } from '@visx/voronoi';
import { localPoint } from '@visx/event';
import { Zoom, applyInverseMatrixToPoint, applyMatrixToPoint } from "@visx/zoom";
import { RectClipPath } from "@visx/clip-path";
import { XYT } from '../typings';
import { TransformMatrix } from "@visx/zoom/lib/types"

export type DotsProps = {
    width: number;
    height: number;
    xyts: XYT[];
};

const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;
const clamp = (min: number, max: number, value: number) => Math.max(min, Math.min(max, value));
const floor = (value: number) => Math.floor(value);

const x = (xy: XYT) => xy[0];
const y = (xy: XYT) => xy[1];
const text = (xy: XYT) => xy[2];

const neighborRadius = 200;
const margin = 200;

let tooltipTimeout: number;

export default withTooltip<DotsProps, XYT>(
    ({
        width,
        height,
        hideTooltip,
        showTooltip,
        tooltipOpen,
        tooltipData,
        tooltipLeft,
        tooltipTop,
        xyts,
    }: DotsProps & WithTooltipProvidedProps<XYT>) => {
        const initialTransform = useMemo(() => ({
            scaleX: 1,
            scaleY: 1,
            translateX: -width / 2,
            translateY: -height / 2,
            skewX: 0,
            skewY: 0
        }), [width, height]);

        const voronoiLayout = useMemo(
            () =>
                voronoi<XYT>({
                    x: (xy) => x(xy) + margin,
                    y: (xy) => y(xy) + margin,
                    width: width,
                    height: height,
                })(xyts),
            [width, height],
        );

        const xScale = useMemo(
            () =>
                scaleLinear<number>({
                    domain: [-(margin / 2), margin / 2],
                    range: [0, width],
                }),
            [width],
        );

        const yScale = useMemo(
            () =>
                scaleLinear<number>({
                    domain: [-(margin / 2), (margin / 2)],
                    range: [height, 0],
                }),
            [height],
        );

        const handleMouseMove = useCallback(
            (event: React.MouseEvent | React.TouchEvent, transformMatrix: TransformMatrix) => {
                if (tooltipTimeout) clearTimeout(tooltipTimeout);

                const point = localPoint(event);
                if (!point) return;

                const zoomedOutPoint = applyInverseMatrixToPoint(transformMatrix, point);

                const closest = voronoiLayout.find(
                    xScale.invert(zoomedOutPoint.x) + margin,
                    yScale.invert(zoomedOutPoint.y) + margin,
                    neighborRadius
                );
                if (!closest) return;

                const zoomedInPoint = applyMatrixToPoint(transformMatrix, {
                    x: xScale(x(closest.data)),
                    y: yScale(y(closest.data))
                });

                showTooltip({
                    tooltipLeft: zoomedInPoint.x,
                    tooltipTop: zoomedInPoint.y,
                    tooltipData: closest.data,
                });
            },
            [xScale, yScale, showTooltip, voronoiLayout],
        );

        const handleMouseLeave = useCallback(() => {
            tooltipTimeout = window.setTimeout(() => {
                hideTooltip();
            }, 300);
        }, [hideTooltip]);

        return (
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
                    <div className='relative'>
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

                            <rect width={width} height={height} rx={14} fill="#0a0a0a" />

                            <rect
                                width={width}
                                height={height}
                                rx={14}
                                fill="transparent"
                                onTouchStart={zoom.dragStart}
                                onTouchMove={(e) => {
                                    handleMouseLeave();
                                    zoom.dragMove(e)
                                }}
                                onTouchEnd={() => {
                                    handleMouseLeave();
                                    zoom.dragEnd();
                                }}
                                onMouseDown={zoom.dragStart}
                                onMouseMove={(e) => {
                                    handleMouseMove(e, zoom.transformMatrix);
                                    zoom.dragMove(e);
                                }}
                                onMouseUp={zoom.dragEnd}
                                onMouseLeave={() => {
                                    handleMouseLeave();
                                    if (zoom.isDragging) zoom.dragEnd();
                                }}
                                onDoubleClick={(event) => {
                                    const point = localPoint(event) || { x: 0, y: 0 };
                                    zoom.scale({ scaleX: 1.1, scaleY: 1.1, point });
                                }}
                            />

                            <Group
                                transform={zoom.toString()}
                                pointerEvents="none"
                            >
                                {xyts.map((xy, i) => (
                                    <Circle
                                        key={`point-${xy[0]}-${i}`}
                                        className="dot"
                                        cx={xScale(x(xy))}
                                        cy={yScale(y(xy))}
                                        r={
                                            floor(clamp(
                                                2,
                                                10,
                                                lerp(2, 10, text(xy).length / 100)
                                            ))
                                        }
                                        fill={tooltipData === xy ? 'white' : '#f6c431'}
                                    />
                                ))}
                            </Group>
                        </svg>

                        {tooltipOpen && tooltipData && tooltipLeft != null && tooltipTop != null && (
                            <Tooltip left={tooltipLeft + 10} top={tooltipTop + 10}>
                                <div>
                                    <strong>{text(tooltipData)}</strong>
                                </div>
                            </Tooltip>
                        )}
                    </div>
                )}
            </Zoom>
        );
    },
);