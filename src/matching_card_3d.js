window.initGame = (React, assetsUrl) => {
  const { useState, useEffect, useRef, Suspense, useMemo } = React;
  const { useFrame, useLoader, useThree } = window.ReactThreeFiber;
  const { useSpring, animated } = window.ReactSpring;
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

  const AnimatedCard = animated(function AnimatedCard({ position, isActive, onFlip, cardIndex }) {
    const cardRef = useRef();
    const [{ cardY }, api] = useSpring(() => ({ cardY: isActive ? 0 : -1 }));

    useFrame((state, delta) => {
      if (cardRef.current) {
        api.start({ cardY: isActive ? 0 : -1, config: { duration: 500 } });
        cardRef.current.position.y = cardY;
      }
    });

    return React.createElement(
      'group',
      { 
        ref: cardRef,
        position: position,
        onClick: onFlip
      },
      React.createElement(CardModel, { 
        url: `${assetsUrl}/card.glb`,
        scale: [2, 2, 2],
        position: [0, -0.5, 0]
      })
    );
  });

  function MatchingCardGame() {
    const [cards, setCards] = useState(Array(18).fill(false));
    const [flippedCards, setFlippedCards] = useState([]);
    const [score, setScore] = useState(0);

    useEffect(() => {
      const shuffleCards = () => {
        const cardIndexes = Array.from({ length: 18 }, (_, i) => i);
        for (let i = cardIndexes.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [cardIndexes[i], cardIndexes[j]] = [cardIndexes[j], cardIndexes[i]];
        }
        setCards(cardIndexes.map(index => index < 9));
      };

      shuffleCards();
    }, []);

    const flipCard = (index) => {
      if (!cards[index]) {
        setCards(prevCards => {
          const newCards = [...prevCards];
          newCards[index] = true;
          return newCards;
        });
        setFlippedCards(prevCards => [...prevCards, index]);

        if (flippedCards.length === 1 && cards[flippedCards[0]] === cards[index]) {
          setScore(prevScore => prevScore + 1);
          setFlippedCards([]);
        } else if (flippedCards.length === 1) {
          setTimeout(() => {
            setCards(prevCards => {
              const newCards = [...prevCards];
              newCards[index] = false;
              newCards[flippedCards[0]] = false;
              return newCards;
            });
            setFlippedCards([]);
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
      cards.map((isActive, index) => 
        React.createElement(AnimatedCard, {
          key: index,
          position: [
            (index % 6 - 2.5) * 3,
            0,
            (Math.floor(index / 6) - 1.5) * 3
          ],
          isActive: isActive,
          onFlip: () => flipCard(index),
          cardIndex: index
        })
      ),
      React.createElement('div', { style: { position: 'absolute', top: '10px', left: '10px', color: 'white' } }, `Score: ${score}`)
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

  return MatchingCardGame;
};

console.log('Matching Card Game script loaded');
