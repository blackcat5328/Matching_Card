window.initGame = (React, assetsUrl) => {
  const { useState, useEffect, useRef, useMemo } = React;
  const { Canvas, useLoader, useFrame, useThree } = window.ReactThreeFiber;
  const THREE = window.THREE;
  const { GLTFLoader } = window.THREE;

  const HandModel = React.memo(({ url, scale = [1, 1, 1], position = [0, 0, 0] }) => {
    const gltf = useLoader(GLTFLoader, url);
    const copiedScene = useMemo(() => gltf.scene.clone(), [gltf]);

    useEffect(() => {
      copiedScene.scale.set(...scale);
      copiedScene.position.set(...position);
    }, [copiedScene, scale, position]);

    return React.createElement('primitive', { object: copiedScene });
  });

  // Existing CardModel and other components...

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
      React.createElement('ambientLight', { intensity: 0.5 }),
      React.createElement('pointLight', { position: [10, 10, 10] }),
      React.createElement(TableModel), 
      React.createElement(TextModel), 
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
      React.createElement(HandModel, {
        url: `${assetsUrl}/hand.glb`,
        scale: [1, 1, 1],
        position: [0, 1, -5] // Adjust position as necessary
      })
    );
  }

  return MatchingCardGame;
};

// Console log to confirm the script loaded
console.log('Matching card game script loaded');
