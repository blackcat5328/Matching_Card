window.initMatchingCardGame = (React, assetsUrl) => {
  const { useState, useEffect, useMemo } = React;
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

  function Card({ position, isActive, isMatched, onCardClick }) {
    return React.createElement(
      'group',
      {
        position: position,
        onClick: onCardClick
      },
      React.createElement(CardModel, {
        url: `${assetsUrl}/card.glb`,
        scale: [2, 2, 0.5],
        position: [0, 0, isActive || isMatched ? 0 : -0.2]
      })
    );
  }

  function MatchingCardGame() {
    const [cards, setCards] = useState([
      { id: 1, isActive: false, isMatched: false },
      { id: 1, isActive: false, isMatched: false },
      { id: 2, isActive: false, isMatched: false },
      { id: 2, isActive: false, isMatched: false },
      { id: 3, isActive: false, isMatched: false },
      { id: 3, isActive: false, isMatched: false },
      { id: 4, isActive: false, isMatched: false },
      { id: 4, isActive: false, isMatched: false },
      { id: 5, isActive: false, isMatched: false },
      { id: 5, isActive: false, isMatched: false },
      { id: 6, isActive: false, isMatched: false },
      { id: 6, isActive: false, isMatched: false },
      { id: 7, isActive: false, isMatched: false },
      { id: 7, isActive: false, isMatched: false },
      { id: 8, isActive: false, isMatched: false },
      { id: 8, isActive: false, isMatched: false },
      { id: 9, isActive: false, isMatched: false },
      { id: 9, isActive: false, isMatched: false },
    ]);
    const [firstCardIndex, setFirstCardIndex] = useState(-1);
    const [secondCardIndex, setSecondCardIndex] = useState(-1);
    const [score, setScore] = useState(0);

    const handleCardClick = (index) => {
      if (cards[index].isActive || cards[index].isMatched) return;
      
      setCards((prevCards) => {
        const newCards = [...prevCards];
        newCards[index].isActive = true;
        
        if (firstCardIndex === -1) {
          setFirstCardIndex(index);
        } else if (secondCardIndex === -1) {
          setSecondCardIndex(index);
          
          if (newCards[firstCardIndex].id === newCards[index].id) {
            newCards[firstCardIndex].isMatched = true;
            newCards[index].isMatched = true;
            setScore((prevScore) => prevScore + 1);
          } else {
            setTimeout(() => {
              newCards[firstCardIndex].isActive = false;
              newCards[index].isActive = false;
            }, 1000);
          }
          
          setFirstCardIndex(-1);
          setSecondCardIndex(-1);
        }
        
        return newCards;
      });
    };

    return React.createElement(
      React.Fragment,
      null,
      cards.map((card, index) => (
        React.createElement(Card, {
          key: index,
          position: [
            (index % 6 - 2.5) * 3,
            (Math.floor(index / 6) - 1.5) * 3,
            0
          ],
          isActive: card.isActive,
          isMatched: card.isMatched,
          onCardClick: () => handleCardClick(index)
        })
      )),
      React.createElement('div', { style: { position: 'absolute', top: '10px', left: '10px' } }, `Score: ${score}`)
    );
  }

  return MatchingCardGame;
};

console.log('Matching Card game script loaded');
