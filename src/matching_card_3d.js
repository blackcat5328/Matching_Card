window.initGame = (React, assetsUrl) => {
  const { useState, useEffect, useRef, Suspense, useMemo } = React;
  const { useFrame, useLoader, useThree } = window.ReactThreeFiber;
  const THREE = window.THREE;
  const { GLTFLoader } = window.THREE;

  // CardModel component for rendering the card models
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

  // Card component for handling user interaction and displaying the card front and back
  function Card({ position, isActive, cardIndex, onSelect }) {
    const cardRef = useRef();
    const [cardY, setCardY] = useState(-1);

    useFrame((state, delta) => {
      if (cardRef.current) {
        const targetY = isActive ? 0 : -1;
        setCardY(current => THREE.MathUtils.lerp(current, targetY, delta * 5));
        cardRef.current.position.y = cardY;
      }
    });

    return React.createElement(
      'group',
      {
        ref: cardRef,
        position: position,
        onClick: () => onSelect(cardIndex)
      },
      React.createElement(CardModel, {
        url: `${assetsUrl}/card_back.glb`,
        scale: [1, 1, 1],
        position: [0, -0.5, 0]
      }),
      isActive && React.createElement(CardModel, {
        url: `${assetsUrl}/card_${cardIndex + 1}.glb`, // Use cardIndex to load the correct front model
        scale: [1, 1, 1],
        position: [0, -0.5, 0]
      })
    );
  }

  // Concentration component for managing the game state and logic
  function Concentration() {
    const [cards, setCards] = useState(Array(18).fill(false));
    const [selectedCards, setSelectedCards] = useState([]);
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);

    // Define card positions
    const cardElements = useMemo(() => {
      const cardPositions = [];
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 6; j++) {
          cardPositions.push([
            (j % 2 === 0 ? -1.5 : 1.5) * (j / 2 + 1),
            0,
            (i % 2 === 0 ? -2 : 2) * (i / 2 + 1)
          ]);
        }
      }
      return cardPositions;
    }, []);

    useEffect(() => {
      // Reset cards at the start of each level
      const resetCards = () => {
        setCards(prevCards => {
          const newCards = [...prevCards];
          for (let i = 0; i < 18; i++) {
            newCards[i] = false;
          }
          return newCards;
        });
      };

      // Shuffle card indices for random card arrangement
      const shuffledIndices = Array.from({ length: 18 }, (_, i) => i).sort(() => 0.5 - Math.random());

      // Create card state based on shuffled indices
      const newCards = [];
      for (let i = 0; i < 18; i++) {
        newCards.push(shuffledIndices[i] % 2 === 0 ? true : false);
      }

      setCards(newCards);
      setSelectedCards([]);
      setScore(0);

      // Start a timer for level completion
      const timer = setTimeout(() => {
        setLevel(prevLevel => prevLevel + 1);
        resetCards();
      }, 10 * 1000 * level);

      return () => {
        clearTimeout(timer);
      };
    }, [level]);

    const selectCard = (index) => {
      // Handle card selection logic
      if (selectedCards.length < 2 && !cards[index]) {
        setCards(prevCards => {
          const newCards = [...prevCards];
          newCards[index] = true;
          return newCards;
        });

        setSelectedCards(prevSelectedCards => [...prevSelectedCards, index]);

        // Check if two cards are selected
        if (selectedCards.length === 2) {
          // Check if selected cards are a match
          if (selectedCards[0] % 2 === selectedCards[1] % 2) {
            setScore(prevScore => prevScore + 10 * level);
            setSelectedCards([]);

            // Check if all pairs are matched
            if (score === 90 * level) {
              setLevel(prevLevel => prevLevel + 1);
            }
          } else {
            // If not a match, hide the cards after a delay
            const newCards = [...cards];
            newCards[selectedCards[0]] = false;
            newCards[selectedCards[1]] = false;

            setCards(newCards);
            setSelectedCards([]);
          }
        }
      }
    };

    return React.createElement(
      React.Fragment,
      null,
      React.createElement('ambientLight', { intensity: 0.5 }),
      React.createElement('pointLight', { position: [10, 10, 10] }),
      // Render cards
      cardElements.map((position, index) => 
        React.createElement(Card, {
          key: index,
          position: position,
          isActive: cards[index],
          cardIndex: index,
          onSelect: selectCard
        })
      ),
      // Display level and score
      React.createElement('text', {
        position: [0, 5, 0],
        fontSize: 2,
        color: 'white'
      }, `Level: ${level} Score: ${score}`)
    );
  }

  // Return the Concentration component
  return Concentration;
};

console.log('3D Concentration game script loaded');
