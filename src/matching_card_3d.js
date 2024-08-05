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

  function Card({ position, isMatched, isRevealed, onCardClick }) {
    const cardRef = useRef();
    const [cardY, setCardY] = useState(-1);

    useFrame((state, delta) => {
      if (cardRef.current) {
        const targetY = isRevealed ? 0 : -1;
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
        url: `${assetsUrl}/${isMatched ? 'matched_card' : 'card'}.glb`,
        scale: [2, 2, 2],
        position: [0, -0.5, 0]
      })
    );
  }

  function MatchingCardGame() {
    const [cards, setCards] = useState(Array(18).fill({ isMatched: false, isRevealed: false }));
    const [selectedCards, setSelectedCards] = useState([]);
    const [score, setScore] = useState(0);

    useEffect(() => {
      const shuffledCards = [...cards].sort(() => Math.random() - 0.5);
      setCards(shuffledCards.map((card, index) => ({
        isMatched: false,
        isRevealed: false,
        id: index
      })));
    }, []);

    const handleCardClick = (index) => {
      if (!cards[index].isMatched && !cards[index].isRevealed) {
        setCards(prevCards => {
          const newCards = [...prevCards];
          newCards[index].isRevealed = true;
          return newCards;
        });
        setSelectedCards(prevSelectedCards => [...prevSelectedCards, index]);

        if (selectedCards.length === 1) {
          if (cards[selectedCards[0]].id === cards[index].id) {
            setCards(prevCards => {
              const newCards = [...prevCards];
              newCards[selectedCards[0]].isMatched = true;
              newCards[index].isMatched = true;
              return newCards;
            });
            setScore(prevScore => prevScore + 1);
            setSelectedCards([]);
          } else {
            setTimeout(() => {
              setCards(prevCards => {
                const newCards = [...prevCards];
                newCards[selectedCards[0]].isRevealed = false;
                newCards[index].isRevealed = false;
                return newCards;
              });
              setSelectedCards([]);
            }, 1000);
          }
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
          key: index,
          position: [
            (index % 6 - 2.5) * 2,
            0,
            (Math.floor(index / 6) - 1.5) * 2
          ],
          isMatched: card.isMatched,
          isRevealed: card.isRevealed,
          onCardClick: () => handleCardClick(index)
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

console.log('Matching Card game script loaded');
