window.initGame = (React, assetsUrl) => {
  const { useState, useEffect, useRef, useMemo } = React;
  const { useFrame, useLoader } = window.ReactThreeFiber;
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

  function Card({ position, isFlipped, onFlip, cardIndex }) {
    const cardRef = useRef();
    const [cardY, setCardY] = useState(-1);

    useFrame((state, delta) => {
      if (cardRef.current) {
        const targetY = isFlipped ? 0 : -1;
        setCardY(current => THREE.MathUtils.lerp(current, targetY, delta * 5));
        cardRef.current.position.y = cardY;
      }
    });

    return React.createElement(
      'group',
      { 
        ref: cardRef,
        position: position,
        onClick: () => onFlip(cardIndex)
      },
      React.createElement(CardModel, { 
        url: `${assetsUrl}/card_back.glb`,
        scale: [2, 2, 2],
        position: [0, -0.5, 0]
      })
    );
  }

  function MatchingCardGame() {
    const [cards, setCards] = useState(Array(18).fill(false));
    const [selectedCard, setSelectedCard] = useState(null);
    const [score, setScore] = useState(0);

    useEffect(() => {
      const initializeCards = () => {
        let initialCards = [];
        for (let i = 0; i < 9; i++) {
          initialCards.push(i);
          initialCards.push(i);
        }
        initialCards = shuffleArray(initialCards);
        setCards(Array(18).fill(false).map((card, index) => ({ id: initialCards[index], flipped: false })));
      };

      initializeCards();
    }, []);

    const shuffleArray = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };

    const flipCard = (index) => {
      if (cards[index].flipped) return;

      if (selectedCard === null) {
        setSelectedCard(index);
      } else {
        if (cards[selectedCard].id === cards[index].id) {
          setScore(prevScore => prevScore + 1);
          setCards(prevCards => {
            const newCards = [...prevCards];
            newCards[selectedCard].flipped = true;
            newCards[index].flipped = true;
            return newCards;
          });
        }
        setSelectedCard(null);
      }
    };

    return React.createElement(
      React.Fragment,
      null,
      React.createElement('ambientLight', { intensity: 0.5 }),
      React.createElement('pointLight', { position: [10, 10, 10] }),
      cards.map((card, index) => 
        React.createElement(Card, {
          key: index,
          position: [
            (index % 6 - 2.5) * 4,
            0,
            (Math.floor(index / 6) - 1) * 4
          ],
          isFlipped: card.flipped,
          onFlip: (cardIndex) => flipCard(cardIndex),
          cardIndex: index
        })
      )
    );
  }

  return MatchingCardGame;
};

console.log('3D Matching Card game script loaded');
