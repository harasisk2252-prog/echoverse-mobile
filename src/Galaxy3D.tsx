import React, { useEffect, useRef } from "react";
import { GLView, ExpoWebGLRenderingContext } from "expo-gl";
import * as THREE from "three";
import { makeGalaxy, CameraPosition } from "./galaxy-scene";
import type { Memory } from "./store";
import type { Features } from "./features";
export type GalaxyProps = {
  memories: Memory[];
  features: Features;
  camera: CameraPosition;
  reduced: boolean;
  onReady: (pick: (x: number, y: number) => string | undefined) => void;
  onError: (error: string) => void;
  width: number;
  height: number;
};
export default function Galaxy3D(props: GalaxyProps) {
  const camera = useRef(props.camera);
  camera.current = props.camera;
  const cleanup = useRef(() => {});
  useEffect(() => () => cleanup.current(), []);
  function start(gl: ExpoWebGLRenderingContext) {
    try {
      const canvas = {
        width: gl.drawingBufferWidth,
        height: gl.drawingBufferHeight,
        style: {},
        addEventListener() {},
        removeEventListener() {},
        getContext: () => gl,
      };
      const renderer = new THREE.WebGLRenderer({
        canvas: canvas as any,
        context: gl as any,
      });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight, false);
      const scene = makeGalaxy(
        renderer,
        props.memories,
        props.features,
        props.width,
        props.height,
        props.reduced,
      );
      props.onReady(scene.pick);
      let frame = 0,
        live = true;
      function draw() {
        if (!live) return;
        try {
          scene.render(camera.current);
          gl.endFrameEXP();
          frame = requestAnimationFrame(draw);
        } catch (e) {
          live = false;
          props.onError(String(e));
        }
      }
      draw();
      cleanup.current = () => {
        live = false;
        cancelAnimationFrame(frame);
        scene.dispose();
      };
    } catch (e) {
      props.onError(String(e));
    }
  }
  return (
    <GLView
      style={{ width: props.width, height: props.height }}
      onContextCreate={start}
    />
  );
}
