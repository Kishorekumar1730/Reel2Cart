import React, { useRef } from 'react';
import { Pressable, Animated } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const AnimatedButton = ({ onPress, style, children, scaleTo = 0.98, activeOpacity = 0.9, ...props }) => {
    const scaleValue = useRef(new Animated.Value(1)).current;
    const opacityValue = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.parallel([
            Animated.spring(scaleValue, {
                toValue: scaleTo,
                useNativeDriver: true,
                speed: 50,     // slower speed for "heavier" feel
                bounciness: 4, // less bouncy
            }),
            Animated.timing(opacityValue, {
                toValue: activeOpacity, // Use a dedicated prop if needed, defaulting to activeOpacity
                duration: 100,
                useNativeDriver: true,
            })
        ]).start();
    };

    const handlePressOut = () => {
        Animated.parallel([
            Animated.spring(scaleValue, {
                toValue: 1,
                useNativeDriver: true,
                speed: 50,
                bounciness: 4,
            }),
            Animated.timing(opacityValue, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            })
        ]).start();
    };

    // For web hover
    const handleHoverIn = () => {
        Animated.spring(scaleValue, {
            toValue: 1.01, // subtle lift
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    const handleHoverOut = () => {
        Animated.spring(scaleValue, {
            toValue: 1,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    return (
        <AnimatedPressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onHoverIn={handleHoverIn}
            onHoverOut={handleHoverOut}
            style={[
                style,
                {
                    transform: [{ scale: scaleValue }],
                    opacity: opacityValue
                }
            ]}
            {...props}
        >
            {children}
        </AnimatedPressable>
    );
};

export default AnimatedButton;
