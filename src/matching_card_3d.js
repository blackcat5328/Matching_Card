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

  function Card({ position, isActive, onFlip, cardIndex, cardSetIndex, isMatched, model, onCardRemoved }) {
    const cardRef = useRef();
    const [cardY, setCardY] = useState(isActive ? 0 : -1); // Initialize cardY based on isActive
    const [isCardRemoved, setIsCardRemoved] = useState(false);

    useFrame((state, delta) => {
      if (cardRef.current) {
        const targetY = isActive ? 0 : -1;
        setCardY(current => THREE.MathUtils.lerp(current, targetY, delta * 5));
        cardRef.current.position.y = cardY;
      }
    });

    const handleClick = () => {
      if (!isMatched && !isCardRemoved && cardY === -1) { // Check if the card is not matched and not flipped
        setCardY(0); // Flip the card up
        onFlip(cardIndex, cardSetIndex);
      }
    };

    useEffect(() => {
      if (isMatched) {
        setTimeout(() => {
          setIsCardRemoved(true);
          onCardRemoved();
        }, 1000);
      }
    }, [isMatched, onCardRemoved]);

    return isCardRemoved ? null : React.createElement(
      'group',
      { 
        ref: cardRef,
        position: position,
        onClick: handleClick
      },
      React.createElement(CardModel, { 
        url: `${assetsUrl}/${model}`, 
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
    const [cards, setCards] = useState([]);
    const [flippedCards, setFlippedCards] = useState([]);
    const [score, setScore] = useState(0);
    const [matchedCards, setMatchedCards] = useState([]); // Initialize as an empty array
    const [levelPassed, setLevelPassed] = useState(false);
    const [removedCards, setRemovedCards] = useState(0);

    useEffect(() => {
      const initialCards = Array(9).fill(0).flatMap((_, setIndex) => {
        const cardSet = Array(2).fill(0).map((_, cardIndex) => ({
          setIndex,
          cardIndex,
          isActive: true,
          isMatched: false,
          model: `card_${setIndex + 1}.glb` 
        }));
        return cardSet;
      });
      setCards(initialCards.sort(() => Math.random() - 0.5));
    }, []);

    const flipCard = (cardIndex, cardSetIndex) => {
      setFlippedCards(prevFlippedCards => {
        if (prevFlippedCards.length === 2) {
          const firstFlippedCard = prevFlippedCards[0];
          if (
            firstFlippedCard.setIndex === cardSetIndex &&
            firstFlippedCard.cardIndex === cardIndex
          ) {
            setScore(prevScore => prevScore + 1);
            setMatchedCards(prevMatchedCards => [
              ...prevMatchedCards,
              { setIndex: cardSetIndex, cardIndex }
            ]);
            setFlippedCards([]);

            // Check if all cards are matched
            if (matchedCards.length === 9 - removedCards) { // Check if all cards are matched
              setLevelPassed(true);
            }
          } else {
            setTimeout(() => {
              setFlippedCards([]);
            }, 1000);
          }
        } else {
          return [...prevFlippedCards, { setIndex: cardSetIndex, cardIndex }];
        }
      });
    };

    const handleCardRemoved = () => {
      setRemovedCards(prevRemovedCards => prevRemovedCards + 1);
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
            (index % 6 - 2.5) * 3,
            0,
            (Math.floor(index / 6) - 1) * 3
          ],
          isActive: card.isActive,
          onFlip: flipCard,
          cardIndex: card.cardIndex,
          cardSetIndex: card.setIndex,
          isMatched: matchedCards.some(
            matchedCard => matchedCard.setIndex === card.setIndex && matchedCard.cardIndex === card.cardIndex
          ),
          model: card.model,
          onCardRemoved: handleCardRemoved
        })
      ),
      levelPassed && React.createElement('h1', null, 'Level Passed!')
    );
  }

  return MatchingCardGame;
};

console.log('Matching Card game script loaded');
