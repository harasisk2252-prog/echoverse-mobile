import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { makeGalaxy } from "./galaxy-scene";
import type { GalaxyProps } from "./Galaxy3D";
export default function Galaxy3D(props: GalaxyProps) {
  const canvas = useRef<HTMLCanvasElement>(null),
    camera = useRef(props.camera);
  camera.current = props.camera;
  useEffect(() => {
    let frame = 0;
    let scene: ReturnType<typeof makeGalaxy> | undefined;
    try {
      const renderer = new THREE.WebGLRenderer({
        canvas: canvas.current!,
        antialias: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(props.width, props.height, false);
      scene = makeGalaxy(
        renderer,
        props.memories,
        props.features,
        props.width,
        props.height,
        props.reduced,
      );
      props.onReady(scene.pick);
      const draw = () => {
        try {
          scene!.render(camera.current);
          frame = requestAnimationFrame(draw);
        } catch (e) {
          props.onError(String(e));
        }
      };
      draw();
    } catch (e) {
      props.onError(String(e));
    }
    return () => {
      cancelAnimationFrame(frame);
      scene?.dispose();
    };
  }, [
    props.width,
    props.height,
    props.memories,
    props.features,
    props.reduced,
  ]);
  return React.createElement("canvas", {
    ref: canvas,
    style: {
      width: props.width,
      height: props.height,
      display: "block",
      touchAction: "none",
    },
    "aria-label": "Interactive 3D memory galaxy",
  });
}
