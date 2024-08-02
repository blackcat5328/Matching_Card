window.initMatchingCardGame = (React, assetsUrl) => {
  const { useState, useEffect, useRef, useMemo } = React;
  const { useLoader } = window.ReactThreeFiber;
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

  function Card({ position, isActive, isMatched, onFlip }) {
    const cardRef = useRef();
    const [cardY, setCardY] = useState(-1);

    useEffect(() => {
      if (cardRef.current) {
        const targetY = isActive ? 0 : -1;
        setCardY(targetY);
        cardRef.current.position.y = targetY;
      }
    }, [isActive]);

    return React.createElement(
      'group',
      {
        ref: cardRef,
        position: position,
        onClick: onFlip,
        style: { opacity: isMatched ? 0.5 : 1 }
      },
      React.createElement(CardModel, {
        url: `${assetsUrl}/card.glb`,
        scale: [1.5, 1.5, 1.5],
        position: [0, cardY, 0]
      })
    );
  }

  function MatchingCardGame() {
    const [cards, setCards] = useState([]);
    const [flippedCards, setFlippedCards] = useState([]);
    const [score, setScore] = useState(0);

    useEffect(() => {
      // Initialize cards
      const cardData = Array(18)
        .fill()
        .map((_, index) => ({
          id: index,
          isActive: false,
          isMatched: false
        }));

      // Shuffle cards
      for (let i = cardData.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cardData[i], cardData[j]] = [cardData[j], cardData[i]];
      }

      setCards(cardData);
    }, []);

    const flipCard = (index) => {
      setCards((prevCards) => {
        const newCards = [...prevCards];
        newCards[index].isActive = true;
        return newCards;
      });

      setFlippedCards((prevFlippedCards) => [...prevFlippedCards, index]);

      if (flippedCards.length === 1 && cards[flippedCards[0]].id !== cards[index].id) {
        setTimeout(() => {
          setCards((prevCards) => {
            const newCards = [...prevCards];
            newCards[flippedCards[0]].isActive = false;
            newCards[index].isActive = false;
            return newCards;
          });
          setFlippedCards([]);
        }, 1000);
      }

      if (flippedCards.length === 1 && cards[flippedCards[0]].id === cards[index].id) {
        setTimeout(() => {
          setCards((prevCards) => {
            const newCards = [...prevCards];
            newCards[flippedCards[0]].isMatched = true;
            newCards[index].isMatched = true;
            return newCards;
          });
          setFlippedCards([]);
          setScore((prevScore) => prevScore + 1);
        }, 500);
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
            (index % 6 - 2.5) * 3,
            0,
            (Math.floor(index / 6) - 1.5) * 3
          ],
          isActive: card.isActive,
          isMatched: card.isMatched,
          onFlip: () => flipCard(index)
        })
      ),
      React.createElement('div', { style: { position: 'absolute', top: '10px', left: '10px' } }, `Score: ${score}`)
    );
  }

  return MatchingCardGame;
};

console.log('Matching Card game script loaded');