window.initGame = (React, assetsUrl) => {
    const { useState, useEffect, useRef, useMemo } = React;
    const { useLoader, useThree, useFrame } = window.ReactThreeFiber;
    const THREE = window.THREE;
    const { GLTFLoader } = window.THREE;

    const CardModel = React.memo(({ url, scale = [1, 1, 1], position = [0, 0, 0] }) => {
        const gltf = useLoader(GLTFLoader, url);
        const copiedScene = useMemo(() => gltf.scene.clone(), [gltf]);

        useEffect(() => {
            copiedScene.scale.set(...scale);
            copiedScene.position.set(...position);
        }, [copiedScene, scale, position]);

        return React.createElement('primitive', { object: copiedScene });
    });

    function TableModel() {
        const tableUrl = `${assetsUrl}/table.glb`;
        return React.createElement(CardModel, {
            url: tableUrl,
            scale: [8, 3.5, 13],
            position: [1, -2.5, -5]
        });
    }

    function Table2Model() {
        const table2Url = `${assetsUrl}/cube.glb`;
        return React.createElement(CardModel, {
            url: table2Url,
            scale: [100, 50, 100],
            position: [5, 45, -5]
        });
    }

    function BooModel() {
        const table2Url = `${assetsUrl}/boo.glb`;
        return React.createElement(CardModel, {
            url: table2Url,
            scale: [8, 7, 13],
            position: [-11.5, 0, -5]
        });
    }

    function ChairModel({ position }) {
        const chairUrl = `${assetsUrl}/chair.glb`;
        return React.createElement(CardModel, {
            url: chairUrl,
            scale: [2, 2, -3],
            position: position
        });
    }

    function TextModel() {
        const textUrl = `${assetsUrl}/welcome.glb`;
        return React.createElement(CardModel, {
            url: textUrl,
            scale: [5, 8, 15],
            position: [-5, 6, -5]
        });
    }

    function Card({ index, url, isRevealed, onReveal, position }) {
        const handleClick = () => {
            if (!isRevealed) {
                onReveal(index);
            }
        };

        return React.createElement(
            'group',
            { onClick: handleClick, position },
            React.createElement(CardModel, { 
                url: isRevealed ? url : `${assetsUrl}/card_back.glb`,
                scale: [2, 2, 2],
                position: [5, 0, -0.5]
            })
        );
    }

    function RotatingModel({ url, onClick }) {
        const modelRef = useRef();
        useFrame(() => {
            if (modelRef.current) {
                modelRef.current.rotation.y += 0.01;
            }
        });

        return React.createElement(CardModel, {
            url: url,
            scale: [5, 5, 5],
            position: [-2, 5, -5],
            ref: modelRef,
            onClick: onClick
        });
    }

    function Camera() {
        const { camera } = useThree();
        const initialPosition = new THREE.Vector3(10, 10, 0.5);
        const targetPosition = new THREE.Vector3(0, 0, 0);
        const xLimitMin = 4;
        const xLimitMax = 15;
        const yLimitMin = 4;
        const yLimitMax = 10;

        useEffect(() => {
            camera.position.copy(initialPosition);
            camera.fov = 75;
            camera.updateProjectionMatrix();
            camera.lookAt(targetPosition);
        }, [camera]);

        useFrame(() => {
            camera.position.z = 0.1;
            camera.position.x = THREE.MathUtils.clamp(camera.position.x, xLimitMin, xLimitMax);
            camera.position.y = THREE.MathUtils.clamp(camera.position.y, yLimitMin, yLimitMax);
        });

        return null;
    }

    function HandModel({ url, scale = [1, 1, 1], position = [0, 0, 0] }) {
        const gltf = useLoader(GLTFLoader, url);
        const copiedScene = useMemo(() => gltf.scene.clone(), [gltf]);

        useEffect(() => {
            copiedScene.scale.set(...scale);
            copiedScene.position.set(...position);
            copiedScene.rotation.set(0, Math.PI, 0);
        }, [copiedScene, scale, position]);

        return React.createElement('primitive', { object: copiedScene });
    }

    function Hand() {
        const handRef = useRef();
        const { camera, mouse } = useThree();
        const baseScale = 3;

        useEffect(() => {
            if (handRef.current) {
                handRef.current.layers.set(1);
            }
        }, []);

        useFrame((state) => {
            if (handRef.current) {
                const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
                vector.unproject(camera);
                const dir = vector.sub(camera.position).normalize();
                const distance = -camera.position.z / dir.z;
                const pos = camera.position.clone().add(dir.multiplyScalar(distance));
                handRef.current.position.copy(pos);
                const distanceFromCamera = camera.position.distanceTo(pos);
                const scale = baseScale * Math.min(distanceFromCamera / 15, 1.5);
                handRef.current.scale.set(scale, scale, scale);
                handRef.current.visible = true; 
            }
        });

        const handleClick = () => {
            // Click logic...
        };

        return React.createElement(
            'group',
            { ref: handRef, onClick: handleClick },
            React.createElement(HandModel, { 
                url: `${assetsUrl}/hand.glb`,
                scale: [1, 1, 1],
                position: [0.3, -0.3, 0],
            })
        );
    }

    function MatchingCardGame() {
        const [cards, setCards] = useState([]);
        const [revealedCards, setRevealedCards] = useState([]);
        const [pairsFound, setPairsFound] = useState([]);
        const [totalPairs, setTotalPairs] = useState(5);

        useEffect(() => {
            resetGame();
        }, [assetsUrl, totalPairs]);

        const resetGame = () => {
            const cardUrls = [];
            for (let i = 1; i <= totalPairs; i++) {
                cardUrls.push(`${assetsUrl}/card_${i}.glb`);
                cardUrls.push(`${assetsUrl}/card_${i}.glb`);
            }
            setCards(shuffleArray(cardUrls));
            setRevealedCards([]);
            setPairsFound([]);
        };

        const shuffleArray = (array) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        };

        const revealCard = (index) => {
            if (!revealedCards.includes(index) && revealedCards.length < 2) {
                setRevealedCards(prev => {
                    const newRevealed = [...prev, index];
                    if (newRevealed.length === 2) {
                        setTimeout(() => checkMatch(newRevealed), 1000);
                    }
                    return newRevealed;
                });
            }
        };

        const checkMatch = (revealed) => {
            const [first, second] = revealed;
            if (cards[first] === cards[second]) {
                setPairsFound(prev => [...prev, cards[first]]);
            }
            setRevealedCards([]);
        };

        const cardSpacing = 2.2;
        const cardsPerRow = totalPairs === 5 ? 2 : 4;
        const cardPositions = cards.map((_, index) => [
            (index % cardsPerRow) * cardSpacing - (2.5 * cardsPerRow / 2),
            0.1,
            Math.floor(index / cardsPerRow) * -cardSpacing
        ]);

        const allPairsFound = pairsFound.length === totalPairs;

        useEffect(() => {
            if (allPairsFound) {
                const timer = setTimeout(() => {
                    setTotalPairs(prev => (prev === 5 ? 10 : 5));
                    resetGame();
                }, 3000);
                return () => clearTimeout(timer);
            }
        }, [allPairsFound]);

        return React.createElement(
            React.Fragment,
            null,
            React.createElement(Camera),
            React.createElement('ambientLight', { intensity: 0.5 }),
            React.createElement('pointLight', { position: [10, 10, 10] }),
            React.createElement(
                'group',
                { renderOrder: 0 },
                React.createElement(TableModel),
                React.createElement(Table2Model),
                React.createElement(BooModel),
                React.createElement(TextModel),
                React.createElement(ChairModel, { position: [-10, -2.5, -5] }),
                React.createElement(ChairModel, { position: [10, -2.5, -5] }),
                React.createElement(ChairModel, { position: [2, -2.5, 5] }),
                React.createElement(ChairModel, { position: [2, -2.5, -15] }),
                allPairsFound 
                    ? React.createElement(RotatingModel, { 
                        url: totalPairs === 10 ? `${assetsUrl}/finish.glb` : `${assetsUrl}/next.glb`, 
                        onClick: resetGame 
                      }) 
                    : cards.map((url, index) =>
                        !pairsFound.includes(url) && React.createElement(Card, {
                            key: index,
                            index: index,
                            url: url,
                            isRevealed: revealedCards.includes(index),
                            onReveal: revealCard,
                            position: cardPositions[index]
                        })
                    )
            ),
            React.createElement(
                'group',
                { renderOrder: 2 },
                React.createElement(Hand)
            )
        );
    }

    return MatchingCardGame;
};

console.log('Matching card game script loaded');
