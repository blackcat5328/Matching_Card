window.initGame = (React, assetsUrl) => {
  const { useState, useEffect, useRef, useMemo } = React;
  const { useLoader, useThree } = window.ReactThreeFiber;
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

  function Card({ index, url, isRevealed, onReveal, position }) {
    const cardRef = useRef();
    const handleClick = () => {
      if (!isRevealed) {
        onReveal(index);
      }
    };

    return React.createElement(
      'group',
      { ref: cardRef, onClick: handleClick, position },
      React.createElement(CardModel, { 
        url: isRevealed ? url : `${assetsUrl}/card_back.glb`,
        scale: [2, 2, 2],
        position: [0, 0, 0]
      })
    );
  }

  function Camera() {
    const { camera } = useThree();
    
    useEffect(() => {
      camera.position.set(0, 10, 15);
      camera.lookAt(0, 0, 0);
    }, [camera]);

    return null;
  }

  function MatchingCardGame() {
    const [cards, setCards] = useState([]);
    const [revealedCards, setRevealedCards] = useState([]);
    const [pairsFound, setPairsFound] = useState([]);
    const totalPairs = 5; // 5 pairs

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

    const cardSpacing = 3; // Adjust spacing as needed
    const cardPositions = cards.map((_, index) => [
      index * cardSpacing,      // X position for horizontal layout
      0,                        // Y position remains constant
      0                         // Z position remains constant
    ]);

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(Camera),
      React.createElement('ambientLight', { intensity: 0.5 }),
      React.createElement('pointLight', { position: [10, 10, 10] }),
      cards.map((url, index) =>
        !pairsFound.includes(url) && React.createElement(Card, {
          key: index,
          index: index,
          url: url,
          isRevealed: revealedCards.includes(index),
          onReveal: revealCard,
          position: cardPositions[index] // Pass the calculated position
        })
      )
    );
  }

  return MatchingCardGame;
};

console.log('Matching card game script loaded');
