// ScoreDisplay — Tactile Console treatment.
// Centered ember-glow score with subtle BEST callout to the right.
import React from 'react';
import { View, Text } from 'react-native';
import { colors, fontWeight } from '@/lib/design/tokens';

interface ScoreDisplayProps {
  score: number;
  highScore?: number;
  multiplier?: number;
}

export function ScoreDisplay({ score, highScore, multiplier = 1 }: ScoreDisplayProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingTop: 8,
        paddingBottom: 6,
      }}
    >
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text
          style={{
            fontSize: 9,
            fontWeight: fontWeight.bold,
            color: colors.inkSoft,
            letterSpacing: 1.6,
          }}
        >
          SCORE
        </Text>
        <Text
          style={{
            fontSize: 32,
            fontWeight: fontWeight.black,
            color: colors.ember,
            marginTop: 2,
            letterSpacing: -1.2,
          }}
        >
          {score.toLocaleString()}
        </Text>
        {multiplier > 1 && (
          <View
            style={{
              marginTop: 4,
              backgroundColor: colors.ember,
              paddingHorizontal: 10,
              paddingVertical: 3,
              borderRadius: 999,
            }}
          >
            <Text style={{ color: 'white', fontSize: 11, fontWeight: fontWeight.heavy, letterSpacing: 0.5 }}>
              ×{multiplier} COMBO
            </Text>
          </View>
        )}
      </View>
      {highScore !== undefined && (
        <View style={{ alignItems: 'flex-end' }}>
          <Text
            style={{
              fontSize: 9,
              fontWeight: fontWeight.bold,
              color: colors.inkSoft,
              letterSpacing: 1.6,
            }}
          >
            BEST
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontWeight: fontWeight.black,
              color: colors.ink,
              marginTop: 2,
            }}
          >
            {highScore.toLocaleString()}
          </Text>
        </View>
      )}
    </View>
  );
}
