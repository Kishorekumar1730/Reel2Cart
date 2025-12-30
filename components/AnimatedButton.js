import React, { useRef } from 'react';
import { Pressable, Animated } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const AnimatedButton = ({ onPress, style, children, scaleTo = 0.96, activeOpacity = 0.9, ...props }) => {
    const scaleValue = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.parallel([
            Animated.spring(scaleValue, {
                toValue: scaleTo,
                useNativeDriver: true,
                speed: 150,
                bounciness: 10,
            }),
        ]).start();
    };

    const handlePressOut = () => {
        Animated.parallel([
            Animated.spring(scaleValue, {
                toValue: 1,
                useNativeDriver: true,
                speed: 150,
                bounciness: 10,
            }),
        ]).start();
    };

    // For web hover
    const handleHoverIn = () => {
        Animated.spring(scaleValue, {
            toValue: 1.02,
            useNativeDriver: true,
            speed: 150,
            bounciness: 10,
        }).start();
    };

    const handleHoverOut = () => {
        Animated.spring(scaleValue, {
            toValue: 1,
            useNativeDriver: true,
            speed: 150,
            bounciness: 10,
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
                    transform: [{ scale: scaleValue }]
                }
            ]}
            {...props}
        >
            {children}
        </AnimatedPressable>
    );
};

export default AnimatedButton;
