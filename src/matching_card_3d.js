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
    const tableUrl = `${assetsUrl}/table.glb`; // Path to your table model
    return React.createElement(CardModel, {
      url: tableUrl,
      scale: [20, 10, 5], // Adjust scale as needed
      position: [0, -1.5, 0] // Adjust position to place it correctly
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
        scale: [0.5, 1, 0.75], // Adjust scale for cards
        position: [0, 0, 0]
      })
    );
  }

  function RotatingModel() {
    const modelRef = useRef();
    useFrame(() => {
      if (modelRef.current) {
        modelRef.current.rotation.y += 0.01;
      }
    });

    return React.createElement(CardModel, {
      url: `${assetsUrl}/finish.glb`,
      scale: [1, 1, 1],
      position: [0, 0, 0],
      ref: modelRef
    });
  }

  function Camera() {
    const { camera } = useThree();
    
    useEffect(() => {
      camera.position.set(0, 5, 10);
      camera.lookAt(0, 0, 0);
    }, [camera]);

    return null;
  }

  function MatchingCardGame() {
    const [cards, setCards] = useState([]);
    const [revealedCards, setRevealedCards] = useState([]);
    const [pairsFound, setPairsFound] = useState([]);
    const totalPairs = 5;

    useEffect(() => {
      const cardUrls = [];
      for (let i = 1; i <= totalPairs; i++) {
        cardUrls.push(`${assetsUrl}/card_${i}.glb`);
        cardUrls.push(`${assetsUrl}/card_${i}.glb`);
      }
      setCards(shuffleArray(cardUrls));
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

    const cardSpacing = 2.5; // Adjust spacing as needed
    const cardPositions = cards.map((_, index) => [
      (index % 5) * cardSpacing,  // X position
      0.1,                        // Y position above the table
      Math.floor(index / 5) * -cardSpacing // Z position for rows
    ]);

    const allPairsFound = pairsFound.length === totalPairs;

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(Camera),
      React.createElement('ambientLight', { intensity: 0.5 }),
      React.createElement('pointLight', { position: [10, 10, 10] }),
      React.createElement(TableModel), // Add the table model
      allPairsFound 
        ? React.createElement(RotatingModel) 
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
    );
  }

  return MatchingCardGame;
};

console.log('Matching card game script loaded');
