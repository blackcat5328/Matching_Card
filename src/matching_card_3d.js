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
      scale: [23, 5, 13],
      position: [0, -2.5, 0]
    });
  }

  function ChairModel({ position }) {
    const chairUrl = `${assetsUrl}/chair.glb`;
    return React.createElement(CardModel, {
      url: chairUrl,
      scale: [2, 2, 2],
      position: position
    });
  }

  function TextModel() {
    const textUrl = `${assetsUrl}/matchk.glb`;
    return React.createElement(CardModel, {
      url: textUrl,
      scale: [5, 3, 5],
      position: [-5, 5, 0]
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
        position: [0, 0, 0]
      })
    );
  }

  function RotatingModel({ onClick }) {
    const modelRef = useRef();
    useFrame(() => {
      if (modelRef.current) {
        modelRef.current.rotation.y += 0.01;
      }
    });

    return React.createElement(CardModel, {
      url: `${assetsUrl}/finish.glb`,
      scale: [3, 3, 3],
      position: [0, 5, 0],
      ref: modelRef,
      onClick: (e) => {
        e.stopPropagation(); 
        onClick();
      }
    });
  }

  function Camera() {
    const { camera } = useThree();
    const initialPosition = new THREE.Vector3(10, 5, 15);
    const targetPosition = new THREE.Vector3(0, 0, 0);

    useEffect(() => {
      camera.position.copy(initialPosition);
      camera.fov = 75;
      camera.updateProjectionMatrix();
      camera.lookAt(targetPosition);
    }, [camera]);

    return null;
  }

  function HandModel({ url, scale = [1, 1, 1], position = [0, 0, 0] }) {
    const gltf = useLoader(GLTFLoader, url);
    const copiedScene = useMemo(() => gltf.scene.clone(), [gltf]);

    useEffect(() => {
      copiedScene.scale.set(...scale);
      copiedScene.position.set(...position);
      copiedScene.rotation.set(0, Math.PI, 0); // Rotate 180 degrees horizontally
    }, [copiedScene, scale, position]);

    return React.createElement('primitive', { object: copiedScene });
  }

  function Hand() {
    const handRef = useRef();
    const { camera, mouse } = useThree();
    const [isHitting, setIsHitting] = useState(false);
    const hitStartTime = useRef(0);

    useFrame((state) => {
      if (handRef.current) {
        const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
        vector.unproject(camera);
        const dir = vector.sub(camera.position).normalize();
        const distance = -camera.position.z / dir.z;
        const pos = camera.position.clone().add(dir.multiplyScalar(distance));
        handRef.current.position.copy(pos);

        // Hitting animation
        if (isHitting) {
          const elapsedTime = state.clock.getElapsedTime() - hitStartTime.current;
          if (elapsedTime < 0.2) {
            handRef.current.rotation.x = Math.PI / 2 * Math.sin(elapsedTime * Math.PI / 0.2);
          } else {
            setIsHitting(false);
            handRef.current.rotation.x = 0;
          }
        }
      }
    });

    const handleClick = () => {
      setIsHitting(true);
      hitStartTime.current = THREE.MathUtils.clamp(THREE.MathUtils.randFloat(0, 1), 0, 1);
    };

    return React.createElement(
      'group',
      { ref: handRef, onClick: handleClick },
      React.createElement(HandModel, { 
        url: `${assetsUrl}/hand.glb`,
        scale: [5, 5, 5],
        position: [0, 0, -2],
      })
    );
  }

  function MatchingCardGame() {
    const [cards, setCards] = useState([]);
    const [revealedCards, setRevealedCards] = useState([]);
    const [pairsFound, setPairsFound] = useState([]);
    const totalPairs = 5;

    const resetGame = () => {
      setCards([]);
      setRevealedCards([]);
      setPairsFound([]);
      const cardUrls = [];
      for (let i = 1; i <= totalPairs; i++) {
        cardUrls.push(`${assetsUrl}/card_${i}.glb`);
        cardUrls.push(`${assetsUrl}/card_${i}.glb`);
      }
      setCards(shuffleArray(cardUrls));
    };

    useEffect(() => {
      resetGame();
    }, [assetsUrl]);

    const shuffleArray = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };

    const revealCard = (index) => {
      setRevealedCards(prev => {
        const newRevealed = [...prev, index];
        if (newRevealed.length === 2) {
          setTimeout(() => checkMatch(newRevealed), 1000);
        }
        return newRevealed;
      });
    };

    const checkMatch = (revealed) => {
      const [first, second] = revealed;
      if (cards[first] === cards[second]) {
        setPairsFound(prev => [...prev, cards[first]]);
      }
      setRevealedCards([]);
    };

    const cardSpacing = 2.5;
    const cardPositions = cards.map((_, index) => [
      (index % 5) * cardSpacing - (2.5 * 2),
      0.1,
      Math.floor(index / 5) * -cardSpacing
    ]);

    const allPairsFound = pairsFound.length === totalPairs;

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(Camera),
      React.createElement('ambientLight', { intensity: 0.5 }),
      React.createElement('pointLight', { position: [10, 10, 10] }),
      React.createElement(TableModel), 
      React.createElement(TextModel), 
      React.createElement(ChairModel, { position: [10, -2.5, 0] }),  
      React.createElement(ChairModel, { position: [0, -2.5, 10] }),  
      React.createElement(ChairModel, { position: [0, -2.5, -10] }), 
      allPairsFound 
        ? React.createElement(RotatingModel, { onClick: resetGame }) 
        : cards.map((url, index) =>
          !pairsFound.includes(url) && React.createElement(Card, {
            key: index,
            index: index,
            url: url,
            isRevealed: revealedCards.includes(index),
            onReveal: revealCard,
            position: cardPositions[index]
          })
        ),
      React.createElement(Hand) // Add hand model
    );
  }

  return MatchingCardGame;
};

console.log('Matching card game script loaded');
