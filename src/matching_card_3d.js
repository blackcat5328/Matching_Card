window.initGame = (React, assetsUrl) => {
  const { useState, useEffect, useRef, Suspense, useMemo } = React;
  const { useFrame, useLoader, useThree } = window.ReactThreeFiber;
  const THREE = window.THREE;
  const { GLTFLoader } = window.THREE;

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

  function Card({ position, isActive, onFlip }) {
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
        onClick: onFlip
      },
      React.createElement(CardModel, { 
        url: `${assetsUrl}/card.glb`,
        scale: [2, 2, 2],
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
    const [cards, setCards] = useState(Array(18).fill(false));
    const [flippedCards, setFlippedCards] = useState([]);
    const [score, setScore] = useState(0);

    useEffect(() => {
      const shuffleCards = () => {
        const shuffledCards = [...Array(9).keys()].reduce((acc, _, index) => {
          acc.push(index, index);
          return acc;
        }, []);
        shuffledCards.sort(() => Math.random() - 0.5);
        setCards(shuffledCards.map(index => true));
      };

      shuffleCards();
    }, []);

    const flipCard = (index) => {
      if (!cards[index]) return;

      setCards(prevCards => {
        const newCards = [...prevCards];
        newCards[index] = false;
        return newCards;
      });

      setFlippedCards(prevFlipped => {
        if (prevFlipped.length === 2) {
          if (prevFlipped[0] === index) {
            setScore(prevScore => prevScore + 1);
            return [index];
          } else {
            setCards(prevCards => {
              const newCards = [...prevCards];
              newCards[prevFlipped[0]] = true;
              newCards[index] = true;
              return newCards;
            });
            return [];
          }
        } else {
          return [...prevFlipped, index];
        }
      });
    };

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(Camera),
      React.createElement('ambientLight', { intensity: 0.5 }),
      React.createElement('pointLight', { position: [10, 10, 10] }),
      cards.map((isActive, index) => 
        React.createElement(Card, {
          key: index,
          position: [
            (index % 6 - 2.5) * 3,
            0,
            (Math.floor(index / 6) - 1.5) * 3
          ],
          isActive: isActive,
          onFlip: () => flipCard(index)
        })
      )
    );
  }

  return MatchingCardGame;
};

console.log('Matching Card game script loaded');
