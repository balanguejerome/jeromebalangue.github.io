import * as THREE from "../vendor/three/three.module.min.js";
import rollUpBannerArtwork from "../media/textures/rollup-banner-art.jpg";
import collapsibleBoothArtwork from "../media/images/FOR ACTUAL MODEL BOOTH (1).png";

const degreesToRadians = (degrees) => THREE.MathUtils.degToRad(degrees);
const embeddedArtwork = {
    banner: rollUpBannerArtwork,
    booth: collapsibleBoothArtwork
};
const boothArtworkRegions = {
    header: { x: 840, y: 190, width: 470, height: 185 },
    front: { x: 820, y: 775, width: 520, height: 655 },
    left: { x: 345, y: 775, width: 330, height: 655 },
    right: { x: 1475, y: 775, width: 340, height: 655 }
};

export class PrintWebGLViewer {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
        this.camera.position.set(0, 0.25, 9);
        this.root = new THREE.Group();
        this.scene.add(this.root);

        this.renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.textureLoader = new THREE.TextureLoader();
        this.maximumAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
        this.currentKind = "";

        const ambientLight = new THREE.HemisphereLight(0xdceaff, 0x07101c, 2.1);
        this.scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0xffffff, 4.1);
        keyLight.position.set(4.5, 6.5, 7);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(1024, 1024);
        keyLight.shadow.camera.near = 0.1;
        keyLight.shadow.camera.far = 30;
        keyLight.shadow.camera.left = -8;
        keyLight.shadow.camera.right = 8;
        keyLight.shadow.camera.top = 8;
        keyLight.shadow.camera.bottom = -8;
        this.scene.add(keyLight);

        const rimLight = new THREE.DirectionalLight(0x72aaff, 2.4);
        rimLight.position.set(-5, 2.5, -6);
        this.scene.add(rimLight);

        const fillLight = new THREE.PointLight(0xbcd8ff, 9, 16);
        fillLight.position.set(-3.5, 0.5, 5);
        this.scene.add(fillLight);

        this.render();
    }

    get isReady() {
        return Boolean(this.renderer);
    }

    resize(width, height) {
        const safeWidth = Math.max(1, Math.round(width));
        const safeHeight = Math.max(1, Math.round(height));
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);

        this.renderer.setPixelRatio(pixelRatio);
        this.renderer.setSize(safeWidth, safeHeight, false);
        this.camera.aspect = safeWidth / safeHeight;
        const isNarrowViewport = safeWidth / safeHeight < 0.85;
        if (this.currentKind === "booth") {
            this.camera.position.z = isNarrowViewport ? 18.2 : 9.1;
        } else if (this.currentKind === "banner") {
            this.camera.position.z = isNarrowViewport ? 10.2 : 9.2;
        }
        this.camera.lookAt(0, 0, 0);
        this.camera.updateProjectionMatrix();
        this.render();
    }

    setRotation(rotationX, rotationY) {
        this.root.rotation.x = degreesToRadians(rotationX);
        this.root.rotation.y = degreesToRadians(rotationY);
        this.render();
    }

    setModel(kind, textureSource) {
        this.disposeRoot();
        this.currentKind = kind;
        const artworkSource = embeddedArtwork[kind] || textureSource;

        if (kind === "banner") {
            this.buildRollUpBanner(artworkSource);
            this.camera.position.set(0, 0.2, 9.2);
        } else if (kind === "booth") {
            this.buildCollapsibleBooth(artworkSource);
            this.camera.position.set(0, 0.25, 9.1);
        }

        this.camera.lookAt(0, 0, 0);
        this.render();
    }

    loadTexture(source, onLoad) {
        return this.textureLoader.load(
            source,
            (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.anisotropy = this.maximumAnisotropy;
                texture.needsUpdate = true;
                onLoad?.(texture);
                this.render();
            },
            undefined,
            () => this.render()
        );
    }

    createCroppedTexture(texture, region, backgroundColor = "#e8f1f7") {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = region.width;
        canvas.height = region.height;

        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(
            texture.image,
            region.x,
            region.y,
            region.width,
            region.height,
            0,
            0,
            canvas.width,
            canvas.height
        );

        const croppedTexture = new THREE.CanvasTexture(canvas);
        croppedTexture.colorSpace = THREE.SRGBColorSpace;
        croppedTexture.anisotropy = this.maximumAnisotropy;
        croppedTexture.needsUpdate = true;
        return croppedTexture;
    }

    createArtworkMaterial(options = {}) {
        return new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.02,
            roughness: 0.58,
            ...options
        });
    }

    createMetalMaterial(color = 0xb9c2cc) {
        return new THREE.MeshStandardMaterial({
            color,
            metalness: 0.86,
            roughness: 0.24
        });
    }

    createBox(width, height, depth, material, position) {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, depth),
            material
        );
        mesh.position.set(position.x, position.y, position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.root.add(mesh);
        return mesh;
    }

    createCylinder(radius, length, material, position) {
        const mesh = new THREE.Mesh(
            new THREE.CylinderGeometry(radius, radius, length, 32),
            material
        );
        mesh.position.set(position.x, position.y, position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.root.add(mesh);
        return mesh;
    }

    addGroundShadow(width, depth, y) {
        const shadow = new THREE.Mesh(
            new THREE.CircleGeometry(1, 64),
            new THREE.ShadowMaterial({
                color: 0x000000,
                opacity: 0.48
            })
        );
        shadow.scale.set(width, depth, 1);
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = y;
        shadow.receiveShadow = true;
        this.root.add(shadow);
    }

    buildRollUpBanner(textureSource) {
        const metal = this.createMetalMaterial();
        const darkMetal = this.createMetalMaterial(0x65717e);
        const edgeMaterial = this.createMetalMaterial(0xaeb8c2);
        const frontMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.02,
            roughness: 0.64
        });
        const backMaterial = new THREE.MeshStandardMaterial({
            color: 0x6d7782,
            metalness: 0.18,
            roughness: 0.62
        });
        const sideMaterials = [
            edgeMaterial,
            edgeMaterial,
            edgeMaterial,
            edgeMaterial,
            frontMaterial,
            backMaterial
        ];

        const banner = new THREE.Mesh(
            new THREE.BoxGeometry(1.76, 4.48, 0.08),
            sideMaterials
        );
        banner.position.set(0, 0.35, 0);
        banner.castShadow = true;
        banner.receiveShadow = true;
        this.root.add(banner);

        this.loadTexture(textureSource, (texture) => {
            frontMaterial.map = texture;
            frontMaterial.needsUpdate = true;
        });

        const topRail = this.createCylinder(
            0.095,
            2.02,
            metal,
            { x: 0, y: 2.58, z: 0 }
        );
        topRail.rotation.z = Math.PI / 2;

        const cassette = this.createCylinder(
            0.245,
            2.25,
            metal,
            { x: 0, y: -1.98, z: 0.02 }
        );
        cassette.rotation.z = Math.PI / 2;

        const cassetteFront = this.createBox(
            2.12,
            0.26,
            0.42,
            darkMetal,
            { x: 0, y: -1.93, z: 0.08 }
        );
        cassetteFront.rotation.x = degreesToRadians(-6);

        const rearPole = this.createCylinder(
            0.045,
            4.22,
            darkMetal,
            { x: 0, y: 0.18, z: -0.17 }
        );
        rearPole.position.z = -0.18;

        const leftFoot = this.createBox(
            0.78,
            0.12,
            1.02,
            metal,
            { x: -0.5, y: -2.2, z: 0.18 }
        );
        leftFoot.rotation.y = degreesToRadians(-7);

        const rightFoot = this.createBox(
            0.78,
            0.12,
            1.02,
            metal,
            { x: 0.5, y: -2.2, z: 0.18 }
        );
        rightFoot.rotation.y = degreesToRadians(7);

        this.addGroundShadow(1.72, 0.72, -2.28);
        this.root.position.y = -0.05;
    }

    buildCollapsibleBooth(textureSource) {
        const frontMaterial = this.createArtworkMaterial();
        const leftMaterial = this.createArtworkMaterial();
        const rightMaterial = this.createArtworkMaterial();
        const headerFrontMaterial = this.createArtworkMaterial({
            roughness: 0.5
        });
        const boothSideMaterial = new THREE.MeshStandardMaterial({
            color: 0x8fb6d1,
            metalness: 0.18,
            roughness: 0.48
        });
        const boothBackMaterial = new THREE.MeshStandardMaterial({
            color: 0x607b91,
            metalness: 0.25,
            roughness: 0.44
        });
        const greenMaterial = new THREE.MeshStandardMaterial({
            color: 0x72ad45,
            metalness: 0.12,
            roughness: 0.48
        });
        const metal = this.createMetalMaterial(0xaeb8c3);

        this.createBox(
            2.3,
            2.04,
            1.12,
            [
                rightMaterial,
                leftMaterial,
                boothSideMaterial,
                boothSideMaterial,
                frontMaterial,
                boothBackMaterial
            ],
            { x: 0, y: -0.87, z: 0 }
        );
        this.createBox(
            2.08,
            0.68,
            0.72,
            [
                greenMaterial,
                greenMaterial,
                greenMaterial,
                greenMaterial,
                headerFrontMaterial,
                greenMaterial
            ],
            { x: 0, y: 1.52, z: 0 }
        );

        [-0.7, 0.7].forEach((poleX) => {
            this.createCylinder(
                0.04,
                1.32,
                metal,
                { x: poleX, y: 0.73, z: -0.06 }
            );
        });

        this.loadTexture(textureSource, (texture) => {
            frontMaterial.map = this.createCroppedTexture(
                texture,
                boothArtworkRegions.front,
                "#e7f1f7"
            );
            leftMaterial.map = this.createCroppedTexture(
                texture,
                boothArtworkRegions.left,
                "#dbeaf4"
            );
            rightMaterial.map = this.createCroppedTexture(
                texture,
                boothArtworkRegions.right,
                "#dbeaf4"
            );
            headerFrontMaterial.map = this.createCroppedTexture(
                texture,
                boothArtworkRegions.header,
                "#7fb64f"
            );
            frontMaterial.needsUpdate = true;
            leftMaterial.needsUpdate = true;
            rightMaterial.needsUpdate = true;
            headerFrontMaterial.needsUpdate = true;
            texture.dispose();
        });

        this.addGroundShadow(1.75, 0.9, -1.93);
        this.root.position.y = -0.05;
        this.root.scale.setScalar(1.08);
    }

    disposeRoot() {
        const textures = new Set();

        while (this.root.children.length) {
            const child = this.root.children.pop();
            child.traverse((object) => {
                object.geometry?.dispose();
                const materials = Array.isArray(object.material)
                    ? object.material
                    : [object.material];

                materials.filter(Boolean).forEach((material) => {
                    if (material.map) textures.add(material.map);
                    material.dispose();
                });
            });
        }

        textures.forEach((texture) => texture.dispose());
        this.root.position.set(0, 0, 0);
        this.root.scale.set(1, 1, 1);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}
