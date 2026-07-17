import { useEffect, useRef, type ReactNode } from "react";

/**
 * Auto-scrolling, infinitely-looping tile marquee.
 *
 * The seamless wrap needs the EXACT width of one copy. We measure the first
 * set's offsetWidth directly (via setRef) rather than halving the track's
 * scrollWidth — halving is off by rounding and by the inter-set gap, which
 * leaves a sliver of blank space trailing the last tile before the reset. An
 * exact measurement makes the second set sit precisely where the first began,
 * so there's no gap at the seam.
 */
export function Carousel({ children }: { children: ReactNode }) {
	const trackRef = useRef<HTMLDivElement>(null);
	const setRef = useRef<HTMLDivElement>(null); // first copy, for exact width
	const offset = useRef(0); // current translateX, <= 0
	const paused = useRef(false);
	const drag = useRef({
		active: false,
		startX: 0,
		startOffset: 0,
		moved: false,
	});
	const SPEED = 0.5;

	// One copy's width INCLUDING the seam gap (the set's padding-right). Read
	// inline where needed so it isn't an effect dependency.
	function setWidth(): number {
		return setRef.current?.offsetWidth ?? 0;
	}

	useEffect(() => {
		const track = trackRef.current;
		if (!track) return;
		let raf = 0;

		const step = () => {
			const one = setRef.current?.offsetWidth ?? 0;
			if (!paused.current && one > 1) {
				offset.current -= SPEED;
				if (offset.current <= -one) offset.current += one;
				track.style.transform = `translateX(${offset.current}px)`;
			}
			raf = requestAnimationFrame(step);
		};
		raf = requestAnimationFrame(step);
		return () => cancelAnimationFrame(raf);
	}, []);

	function onPointerDown(e: React.PointerEvent) {
		e.preventDefault();
		paused.current = true;
		drag.current = {
			active: true,
			startX: e.clientX,
			startOffset: offset.current,
			moved: false,
		};
		trackRef.current?.parentElement?.setPointerCapture(e.pointerId);
	}

	function onPointerMove(e: React.PointerEvent) {
		const track = trackRef.current;
		if (!track || !drag.current.active) return;
		const dx = e.clientX - drag.current.startX;
		if (Math.abs(dx) > 3) drag.current.moved = true;
		const one = setWidth();
		let next = drag.current.startOffset + dx;
		if (one > 0) {
			next = next % one;
			if (next > 0) next -= one;
		}
		offset.current = next;
		track.style.transform = `translateX(${next}px)`;
	}

	function endDrag(e: React.PointerEvent) {
		const vp = trackRef.current?.parentElement;
		if (vp?.hasPointerCapture(e.pointerId))
			vp.releasePointerCapture(e.pointerId);
		drag.current.active = false;
		paused.current = false;
	}

	return (
		// drag-to-pan marquee, not a keyboard control; role=region + label give
		// it a semantic identity.
		// biome-ignore lint/a11y/useSemanticElements: <idk>
		<div
			className="carousel"
			role="region"
			aria-label="Feature highlights"
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={endDrag}
			onPointerCancel={endDrag}
			onClickCapture={(e) => {
				if (drag.current.moved) {
					e.stopPropagation();
					e.preventDefault();
				}
			}}
		>
			<div className="carousel__track" ref={trackRef}>
				{/* Render several copies so the track always exceeds the viewport
				    width — with few tiles, two copies can be narrower than the
				    window and expose a gap at the wrap. The wrap resets after ONE
				    copy's width, so any extra copies just guarantee fill. Only the
				    first is measured + announced; the rest are decorative. */}
				<div className="carousel__set" ref={setRef}>
					{children}
				</div>
				<div className="carousel__set" aria-hidden="true">
					{children}
				</div>
				<div className="carousel__set" aria-hidden="true">
					{children}
				</div>
			</div>
		</div>
	);
}

export function CarouselTile({
	src,
	alt,
	caption,
}: {
	src: string;
	alt: string;
	caption: string;
}) {
	return (
		<figure className="carousel__tile">
			<div className="carousel__thumb">
				<img src={src} alt={alt} draggable={false} />
			</div>
			<figcaption className="carousel__caption">{caption}</figcaption>
		</figure>
	);
}
