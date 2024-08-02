window.initGame = (React, assetsUrl) => {
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

  function Card({ position, isMatched, onFlip }) {
    const cardRef = useRef();
    const [cardRotation, setCardRotation] = useState(0);

    useFrame((state, delta) => {
      if (cardRef.current) {
        const targetRotation = isMatched ? Math.PI / 2 : 0;
        setCardRotation(current => THREE.MathUtils.lerp(current, targetRotation, delta * 5));
        cardRef.current.rotation.y = cardRotation;
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
        scale: [2, 2, 0.5],
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
    const [cards, setCards] = useState(Array(18).fill(false));
    const [score, setScore] = useState(0);
    const [flippedIndices, setFlippedIndices] = useState([]);

    useEffect(() => {
      const shuffleCards = () => {
        const newCards = Array(18)
          .fill()
          .map((_, i) => ({
            index: i,
            value: Math.floor(i / 2)
          }))
          .sort(() => Math.random() - 0.5);
        setCards(newCards.map(card => false));
      };

      shuffleCards();
    }, []);

    const flipCard = (index) => {
      if (!cards[index]) {
        setCards(prevCards => {
          const newCards = [...prevCards];
          newCards[index] = true;
          setFlippedIndices(prevIndices => [...prevIndices, index]);
          return newCards;
        });

        if (flippedIndices.length === 1 && cards[flippedIndices[0]] === cards[index]) {
          setScore(prevScore => prevScore + 1);
          setCards(prevCards => {
            const newCards = [...prevCards];
            newCards[flippedIndices[0]] = true;
            newCards[index] = true;
            setFlippedIndices([]);
            return newCards;
          });
        } else if (flippedIndices.length === 2) {
          setTimeout(() => {
            setCards(prevCards => {
              const newCards = [...prevCards];
              newCards[flippedIndices[0]] = false;
              newCards[flippedIndices[1]] = false;
              setFlippedIndices([]);
              return newCards;
            });
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
      cards.map((isMatched, index) => 
        React.createElement(Card, {
          key: index,
          position: [
            (index % 6 - 2.5) * 4,
            0,
            (Math.floor(index / 6) - 1.5) * 4
          ],
          isMatched: isMatched,
          onFlip: () => flipCard(index)
        })
      ),
      React.createElement('div', { style: { position: 'absolute', top: '20px', left: '20px', color: 'white' } }, `Score: ${score}`)
    );
  }

  return MatchingCardGame;
};

console.log('Matching Card game script loaded');
