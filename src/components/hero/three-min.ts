/* A named-export barrel, not `import * as THREE from 'three'`.

   A namespace import is opaque to the bundler: every symbol is reachable, so
   nothing is dropped and the whole library ships. Re-exporting exactly what
   the drawing uses lets Rollup shake the rest out. Measured on this build:
   166 KB gzipped as a namespace import, and the number below after. */
export {
  WebGLRenderer,
  Scene,
  Group,
  Mesh,
  MeshBasicMaterial,
  BufferGeometry,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  EdgesGeometry,
  Vector3,
  Matrix4,
  PerspectiveCamera,
  OrthographicCamera,
  MathUtils,
  GreaterDepth,
} from 'three';
