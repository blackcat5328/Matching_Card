window.initGame = (React, assetsUrl) => {
  const { useState, useEffect, useRef, Suspense, useMemo } = React;
  const { useFrame, useLoader, useThree } = window.ReactThreeFiber;
  const THREE = window.THREE;
  const { GLTFLoader } = window.THREE;

  // Card Model component - renders a 3D model of a card
  const CardModel = React.memo(function CardModel({ url, scale = [1, 1, 1], position = [0, 0, 0], rotation = [0, 0, 0] }) {
    const gltf = useLoader(GLTFLoader, url);
    const copiedScene = useMemo(() => gltf.scene.clone(), [gltf]);

    useEffect(() => {
      copiedScene.scale.set(...scale);
      copiedScene.position.set(...position);
      copiedScene.rotation.set(...rotation);
    }, [copiedScene, scale, position, rotation]);

    return React.createElement('primitive', { object: copiedScene });
  });

  // Card component - represents a single card in the game
  function Card({ position, cardNumber, isFlipped, onCardClick }) {
    const cardRef = useRef();
    const [flipAngle, setFlipAngle] = useState(0);

    useFrame((state, delta) => {
      if (cardRef.current) {
        const targetAngle = isFlipped ? Math.PI : 0;
        setFlipAngle(current => THREE.MathUtils.lerp(current, targetAngle, delta * 5));
        cardRef.current.rotation.y = flipAngle;
      }
    });

    return React.createElement(
      'group',
      {
        ref: cardRef,
        position: position,
        onClick: onCardClick,
      },
      React.createElement(CardModel, {
        url: `${assetsUrl}/card_back.glb`, // Replace with your card back model
        scale: [1, 1, 1],
        position: [0, 0, 0],
        rotation: [0, 0, 0],
      }),
      React.createElement(CardModel, {
        url: `${assetsUrl}/card_${cardNumber}.glb`, // Replace with your card front model
        scale: [1, 1, 1],
        position: [0, 0, 0],
        rotation: [0, Math.PI, 0],
      }),
    );
  }

  // Camera component - sets up the camera position and orientation
  function Camera() {
    const { camera } = useThree();

    useEffect(() => {
      camera.position.set(0, 10, 15);
      camera.lookAt(0, 0, 0);
    }, [camera]);

    return null;
  }

  // MatchingCardGame component - main game logic
  function MatchingCardGame() {
    const [cards, setCards] = useState([]);
    const [flippedCards, setFlippedCards] = useState([]);
    const [score, setScore] = useState(0);
    const [levelPassed, setLevelPassed] = useState(false);
    const [cardPositions, setCardPositions] = useState([]);

    useEffect(() => {
      // Initialize cards with random numbers (9 pairs)
      const cardNumbers = Array.from({ length: 9 }, (_, i) => i + 1).flatMap(number => [number, number]);
      const shuffledNumbers = shuffleArray(cardNumbers);

      // Set initial card states and positions
      setCards(shuffledNumbers.map((number, index) => ({
        id: index,
        number: number,
        isFlipped: false,
        isMatched: false,
      })));
      setCardPositions(generateCardPositions(18)); // Generate 18 card positions
    }, []);

    // Shuffle array function
    const shuffleArray = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };

    // Generate card positions
    const generateCardPositions = (numCards) => {
      const positions = [];
      const gridSize = 4; // Adjust for card spacing
      for (let i = 0; i < numCards; i++) {
        const x = (i % 3 - 1) * gridSize;
        const z = (Math.floor(i / 3) - 1) * gridSize;
        positions.push([x, 0, z]);
      }
      return positions;
    };

    // Handle card click
    const handleCardClick = (cardId) => {
      const card = cards[cardId];
      if (!card.isFlipped && !card.isMatched) {
        setFlippedCards(prevFlippedCards => [...prevFlippedCards, cardId]);
        setCards(prevCards => {
          const newCards = [...prevCards];
          newCards[cardId].isFlipped = true;
          return newCards;
        });
      }
    };

    // Check for match
    useEffect(() => {
      if (flippedCards.length === 2) {
        const card1 = cards[flippedCards[0]];
        const card2 = cards[flippedCards[1]];

        if (card1.number === card2.number) {
          // Match!
          setScore(prevScore => prevScore + 1);
          setCards(prevCards => {
            const newCards = [...prevCards];
            newCards[flippedCards[0]].isMatched = true;
            newCards[flippedCards[1]].isMatched = true;
            return newCards;
          });
          setFlippedCards([]);
        } else {
          // No match, flip back down after a delay
          setTimeout(() => {
            setCards(prevCards => {
              const newCards = [...prevCards];
              newCards[flippedCards[0]].isFlipped = false;
              newCards[flippedCards[1]].isFlipped = false;
              return newCards;
            });
            setFlippedCards([]);
          }, 1000); // Adjust delay as needed
        }
      }
    }, [flippedCards, cards]);

    // Check for level completion
    useEffect(() => {
      if (cards.every(card => card.isMatched)) {
        setLevelPassed(true);
      }
    }, [cards]);

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(Camera),
      React.createElement('ambientLight', { intensity: 0.5 }),
      React.createElement('pointLight', { position: [10, 10, 10] }),
      cards.map((card, index) =>
        React.createElement(Card, {
          key: index,
          position: cardPositions[index],
          cardNumber: card.number,
          isFlipped: card.isFlipped,
          onCardClick: () => handleCardClick(index),
        })
      ),
      levelPassed && React.createElement('text', { position: [0, 2, 0], fontSize: 3, color: 'white' }, 'Level Passed!'),
    );
  }

  return MatchingCardGame;
};

console.log('3D Matching Card game script loaded');
