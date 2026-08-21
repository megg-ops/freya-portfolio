import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);

const growEase = CustomEase.create("tree-grow", "0.25,1,0.5,1");
const crownEase = CustomEase.create("tree-crown", "0.16,1,0.3,1");
const shadowEase = CustomEase.create("tree-shadow", "0,0,0.58,1");

interface CrownGrowthStep {
  element: HTMLDivElement;
  duration: number;
  enterRotation: number;
  start: number;
}

interface TreeGrowthElements {
  crowns: CrownGrowthStep[];
  groundShadow: HTMLDivElement;
  skeleton: HTMLDivElement;
}

export const TREE_GROWTH_DURATION_SECONDS = 1.5;

export function createTreeGrowthTimeline(
  { crowns, groundShadow, skeleton }: TreeGrowthElements,
  onComplete: () => void,
) {
  const timeline = gsap.timeline({ paused: true });

  gsap.set(skeleton, {
    clipPath: "inset(100% 0% 0% 0%)",
    filter: "blur(1px)",
  });
  gsap.set(groundShadow, { opacity: 0 });
  for (const crown of crowns) {
    gsap.set(crown.element, {
      filter: "blur(1px)",
      opacity: 0,
      rotation: crown.enterRotation,
      scale: 0.86,
    });
  }

  timeline
    .to(
      skeleton,
      {
        clipPath: "inset(55% 0% 0% 0%)",
        duration: 0.72 * 0.48,
        ease: growEase,
      },
      0.04,
    )
    .to(skeleton, {
      clipPath: "inset(28% 0% 0% 0%)",
      duration: 0.72 * 0.24,
      ease: growEase,
    })
    .to(skeleton, {
      clipPath: "inset(0% 0% 0% 0%)",
      duration: 0.72 * 0.28,
      ease: growEase,
    })
    .to(
      skeleton,
      { duration: 0.72, ease: growEase, filter: "blur(0px)" },
      0.04,
    )
    .to(
      groundShadow,
      { duration: 0.32, ease: shadowEase, opacity: 1 },
      0.08,
    );

  for (const crown of crowns) {
    const split = crown.duration * 0.42;
    timeline
      .set(
        crown.element,
        { filter: "blur(1px)", rotation: crown.enterRotation, scale: 0.94 },
        crown.start,
      )
      .to(
        crown.element,
        {
          duration: crown.duration,
          ease: crownEase,
          filter: "blur(0px)",
          rotation: 0,
          scale: 1,
        },
        crown.start,
      )
      .to(
        crown.element,
        { duration: split, ease: crownEase, opacity: 0.76 },
        crown.start,
      )
      .to(
        crown.element,
        {
          duration: crown.duration - split,
          ease: crownEase,
          opacity: 1,
        },
        crown.start + split,
      );
  }

  timeline.call(onComplete, [], TREE_GROWTH_DURATION_SECONDS);
  return timeline;
}
