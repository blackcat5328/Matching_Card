window.initMatchingCardGame = (React, assetsUrl) => {
  const { useState, useEffect, useRef, Suspense, useMemo } = React;
  const { useFrame, useLoader, useThree } = window.ReactThreeFiber;
  const THREE = window.THREE;
  const { GLTFLoader } = window.THREE;

  const CardModel = React.memo(function CardModel({ url, scale = [1, 1, 1], position = [0, 0, 0] }) {
    const gltf = useLoader(GLTFLoader, url);
    const copiedScene = useMemo(() => gltf.scene.clone(), [gltf]);
    
    useEffect(() => {
      copiedScene.scale.set(...scale);
      copiedScene.position.set(...position);
    }, [copiedScene, scale, position]);

    return React.createElement('primitive', { object: copiedScene });
  });

  function Card({ position, isActive, isMatched, onCardClick }) {
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
        onClick: onCardClick
      },
      React.createElement(CardModel, { 
        url: `${assetsUrl}/card.glb`,
        scale: [3, 3, 3],
        position: [0, -0.5, 0]
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
    const [cards, setCards] = useState(
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        isActive: false,
        isMatched: false,
      }))
    );
    const [selectedCards, setSelectedCards] = useState([]);
    const [score, setScore] = useState(0);

    useEffect(() => {
      // Shuffle the cards
      setCards((prevCards) => {
        const shuffledCards = [...prevCards];
        for (let i = shuffledCards.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledCards[i], shuffledCards[j]] = [
            shuffledCards[j],
            shuffledCards[i],
          ];
        }
        return shuffledCards;
      });
    }, []);

    const handleCardClick = (index) => {
      if (selectedCards.length < 2 && !cards[index].isMatched) {
        setCards((prevCards) => {
          const newCards = [...prevCards];
          newCards[index].isActive = true;
          return newCards;
        });
        setSelectedCards((prevSelectedCards) => [...prevSelectedCards, index]);

        if (selectedCards.length === 1 && cards[selectedCards[0]].id === cards[index].id) {
          // Cards match
          setCards((prevCards) => {
            const newCards = [...prevCards];
            newCards[selectedCards[0]].isMatched = true;
            newCards[index].isMatched = true;
            return newCards;
          });
          setSelectedCards([]);
          setScore((prevScore) => prevScore + 1);
        } else if (selectedCards.length === 2) {
          // Cards don't match
          setTimeout(() => {
            setCards((prevCards) => {
              const newCards = [...prevCards];
              newCards[selectedCards[0]].isActive = false;
              newCards[selectedCards[1]].isActive = false;
              return newCards;
            });
            setSelectedCards([]);
          }, 1000);
        }
      }
    };

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(Camera),
      React.createElement('ambientLight', { intensity: 0.5 }),
      React.createElement('pointLight', { position: [10, 10, 10] }),
      cards.map((card, index) =>
        React.createElement(Card, {
          key: card.id,
          position: [
            (index % 6 - 2.5) * 3,
            0,
            (Math.floor(index / 6) - 1.5) * 3,
          ],
          isActive: card.isActive,
          isMatched: card.isMatched,
          onCardClick: () => handleCardClick(index),
        })
      )
    );
  }

  return MatchingCardGame;
};

console.log('Matching Card game script loaded');
