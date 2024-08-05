window.initGame = (React, assetsUrl) => {
  const { useState, useEffect, useRef, Suspense, useMemo } = React;
  const { useFrame, useLoader, useThree } = window.ReactThreeFiber;
  const THREE = window.THREE;
  const { GLTFLoader } = window.THREE;
  const { useSpring, animated } = window.ReactSpring;

  const CardModel = React.memo(function CardModel({ url, scale = [1, 1, 1], position = [0, 0, 0] }) {
    const gltf = useLoader(GLTFLoader, url);
    const copiedScene = useMemo(() => gltf.scene.clone(), [gltf]);

    useEffect(() => {
      copiedScene.scale.set(...scale);
      copiedScene.position.set(...position);
    }, [copiedScene, scale, position]);

    return React.createElement('primitive', { object: copiedScene });
  });

  const Card = React.memo(function Card({ position, isActive, onFlip }) {
    const cardRef = useRef();
    const [flipped, setFlipped] = useState(false);

    const { rotation, scale } = useSpring({
      rotation: isActive ? [0, Math.PI, 0] : [0, 0, 0],
      scale: isActive ? [3, 3, 3] : [3, 3, 1],
      config: { mass: 1, tension: 170, friction: 26 },
    });

    useFrame(() => {
      if (cardRef.current) {
        cardRef.current.rotation.y = rotation.get();
        cardRef.current.scale.set(...scale.get());
      }
    });

    const handleClick = () => {
      setFlipped(!flipped);
      onFlip();
    };

    return React.createElement(
      animated.group,
      {
        ref: cardRef,
        position: position,
        onClick: handleClick,
      },
      React.createElement(CardModel, {
        url: `${assetsUrl}/card.glb`,
        scale: [1, 1, 1],
        position: [0, 0, 0],
      })
    );
  });

  const Scene = React.memo(function Scene() {
    const { camera, scene } = useThree();
    const [cards, setCards] = useState([]);
    const [activeCards, setActiveCards] = useState([]);

    useEffect(() => {
      const newCards = Array(12)
        .fill(0)
        .map((_, i) => ({
          id: i,
          position: [
            (i % 4) * 3 - 4.5,
            Math.floor(i / 4) * 3 - 1.5,
            0,
          ],
          isActive: false,
        }));
      setCards(newCards);
    }, []);

    const handleFlip = (id) => {
      setCards((prevCards) =>
        prevCards.map((card) =>
          card.id === id ? { ...card, isActive: !card.isActive } : card
        )
      );
      setActiveCards((prevActive) => {
        if (prevActive.length === 2) {
          return [id];
        } else {
          return [...prevActive, id];
        }
      });
    };

    useEffect(() => {
      if (activeCards.length === 2) {
        const timer = setTimeout(() => {
          setActiveCards([]);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }, [activeCards]);

    return React.createElement(
      React.Fragment,
      null,
      cards.map((card) =>
        React.createElement(Card, {
          key: card.id,
          position: card.position,
          isActive: activeCards.includes(card.id),
          onFlip: () => handleFlip(card.id),
        })
      )
    );
  });

  const App = () => {
    const { gl, camera, scene } = useThree();

    useEffect(() => {
      camera.position.set(0, 0, 10);
      camera.lookAt(0, 0, 0);
    }, [camera]);

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(Suspense, { fallback: null }, React.createElement(Scene))
    );
  };

  console.log('Matching Card game script loaded');

  return App;
};
