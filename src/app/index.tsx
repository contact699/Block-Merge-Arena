import { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { getTodayDateString } from '@/lib/utils/tournament';
import { hasCompletedWelcome } from '@/lib/utils/tutorial';
import { colors, fontWeight } from '@/lib/design/tokens';
import { GlassCard, DeepCard } from '@/components/design/GlassCard';
import { Pill } from '@/components/design/Pill';
import { TactileButton } from '@/components/design/TactileButton';

const WEEK = [40, 65, 30, 80, 95, 50, 70];
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function Sparkline() {
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 56, gap: 4 }}>
        {WEEK.map((h, i) => {
          const isPeak = i === 4;
          return (
            <View key={i} style={{ flex: 1, height: `${h}%`, justifyContent: 'flex-end' }}>
              {isPeak ? (
                <LinearGradient
                  colors={[colors.emberLight, colors.emberDeep]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={{
                    flex: 1,
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                    shadowColor: colors.ember,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.55,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                />
              ) : (
                <View
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(22,20,15,0.14)',
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                  }}
                />
              )}
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', marginTop: 6, gap: 4 }}>
        {DAYS.map((d, i) => {
          const isPeak = i === 4;
          return (
            <Text
              key={i}
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 9,
                fontWeight: isPeak ? fontWeight.heavy : fontWeight.bold,
                color: isPeak ? colors.ember : colors.inkDim,
                letterSpacing: 1.4,
              }}
            >
              {d}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

function NavTile({
  href,
  testID,
  label,
  hint,
  accent = colors.ink,
}: {
  href: string;
  testID: string;
  label: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <Link href={href as never} asChild>
      <Pressable testID={testID} style={({ pressed }) => ({ flex: 1, transform: [{ translateY: pressed ? 1 : 0 }] })}>
        <GlassCard style={{ padding: 14 }}>
          <View style={{ width: 28, height: 4, borderRadius: 2, backgroundColor: accent, marginBottom: 10 }} />
          <Text style={{ fontSize: 14, fontWeight: fontWeight.heavy, color: colors.ink, letterSpacing: -0.3 }}>
            {label}
          </Text>
          {hint && (
            <Text style={{ color: colors.inkSoft, fontSize: 11, marginTop: 2 }}>{hint}</Text>
          )}
        </GlassCard>
      </Pressable>
    </Link>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const todayDate = getTodayDateString();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      const completedWelcome = await hasCompletedWelcome();
      if (!completedWelcome) router.replace('/welcome');
      else setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.ember, fontSize: 16, fontWeight: fontWeight.bold }}>Loading…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView testID="home-screen" style={{ flex: 1, backgroundColor: colors.paper }}>
      {/* Ambient blobs */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -80,
          right: -60,
          width: 240,
          height: 240,
          borderRadius: 120,
          backgroundColor: colors.ember,
          opacity: 0.16,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: 100,
          left: -60,
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: colors.cobalt,
          opacity: 0.1,
        }}
      />

      {/* Topbar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <LinearGradient
              colors={[colors.emberLight, colors.emberDeep]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <Text style={{ color: 'white', fontWeight: fontWeight.heavy, fontSize: 16 }}>M</Text>
          </View>
          <View>
            <Text style={{ fontSize: 9, fontWeight: fontWeight.bold, color: colors.inkSoft, letterSpacing: 1.6 }}>
              WELCOME BACK
            </Text>
            <Text style={{ fontSize: 16, fontWeight: fontWeight.heavy, color: colors.ink, letterSpacing: -0.4 }}>
              Player
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pill variant="mustard">{`1,420 ◆`}</Pill>
          <Link href="/settings" asChild>
            <Pressable testID="settings-button">
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255,255,255,0.7)',
                  borderWidth: 1,
                  borderColor: 'rgba(22,20,15,0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 16 }}>⚙︎</Text>
              </View>
            </Pressable>
          </Link>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO — Daily Tournament */}
        <Link href="/daily" asChild>
          <Pressable testID="tournament-button">
            <DeepCard style={{ padding: 20, marginTop: 8 }}>
              {/* Inner ember radial */}
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: -50,
                  right: -40,
                  width: 220,
                  height: 220,
                  borderRadius: 110,
                  backgroundColor: colors.ember,
                  opacity: 0.5,
                }}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Pill variant="ember">● LIVE · 847K</Pill>
                  <Text
                    style={{
                      marginTop: 12,
                      fontSize: 28,
                      fontWeight: fontWeight.black,
                      color: colors.paper,
                      letterSpacing: -1,
                    }}
                  >
                    Daily Tournament
                  </Text>
                  <Text style={{ color: 'rgba(243,239,231,0.65)', fontSize: 12, marginTop: 3 }}>
                    Same pieces for everyone · {todayDate}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 9, fontWeight: fontWeight.bold, color: colors.mustard, letterSpacing: 1.6 }}>
                    ENDS IN
                  </Text>
                  <Text style={{ fontSize: 22, fontWeight: fontWeight.black, color: colors.paper, marginTop: 4 }}>
                    14:32
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                {[
                  { label: 'YOUR BEST', value: '—' },
                  { label: 'PRIZE', value: '10k ◆', highlight: true },
                ].map((s) => (
                  <View
                    key={s.label}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      paddingHorizontal: 10,
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.06)',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: fontWeight.bold,
                        color: s.highlight ? colors.mustard : 'rgba(243,239,231,0.55)',
                        letterSpacing: 1.6,
                      }}
                    >
                      {s.label}
                    </Text>
                    <Text style={{ color: colors.paper, fontSize: 16, fontWeight: fontWeight.black, marginTop: 2 }}>
                      {s.value}
                    </Text>
                  </View>
                ))}
              </View>

              <TactileButton variant="primary" style={{ marginTop: 14 }}>
                Enter today's tournament →
              </TactileButton>
            </DeepCard>
          </Pressable>
        </Link>

        {/* Quick play row */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <Link href="/game" asChild>
            <Pressable testID="endless-mode-button" style={{ flex: 1 }}>
              <GlassCard style={{ padding: 14 }}>
                <Text style={{ fontSize: 9, fontWeight: fontWeight.bold, color: colors.ember, letterSpacing: 1.6 }}>
                  ENDLESS
                </Text>
                <Text style={{ fontSize: 16, fontWeight: fontWeight.heavy, color: colors.ink, marginTop: 4 }}>
                  Solo run
                </Text>
                <Text style={{ fontSize: 22, fontWeight: fontWeight.black, color: colors.ink, marginTop: 6 }}>
                  48,210
                </Text>
                <Text style={{ fontSize: 9, fontWeight: fontWeight.bold, color: colors.inkSoft, marginTop: 2, letterSpacing: 1.6 }}>
                  BEST
                </Text>
              </GlassCard>
            </Pressable>
          </Link>
          <Link href="/leaderboard" asChild>
            <Pressable testID="leaderboard-quick-button" style={{ flex: 1 }}>
              <GlassCard style={{ padding: 14 }}>
                <Text style={{ fontSize: 9, fontWeight: fontWeight.bold, color: colors.cobalt, letterSpacing: 1.6 }}>
                  TODAY
                </Text>
                <Text style={{ fontSize: 16, fontWeight: fontWeight.heavy, color: colors.ink, marginTop: 4 }}>
                  Leaderboard
                </Text>
                <Text style={{ fontSize: 22, fontWeight: fontWeight.black, color: colors.ink, marginTop: 6 }}>
                  Top 100
                </Text>
                <Text style={{ fontSize: 9, fontWeight: fontWeight.bold, color: colors.inkSoft, marginTop: 2, letterSpacing: 1.6 }}>
                  VIEW STANDINGS
                </Text>
              </GlassCard>
            </Pressable>
          </Link>
        </View>

        {/* Week chart */}
        <GlassCard style={{ padding: 14, marginTop: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <Text style={{ fontSize: 10, fontWeight: fontWeight.bold, letterSpacing: 1.6, color: colors.ink }}>
              YOUR WEEK
            </Text>
            <Text style={{ fontSize: 9, fontWeight: fontWeight.bold, color: colors.inkSoft, letterSpacing: 1.4 }}>
              +38% VS LAST
            </Text>
          </View>
          <Sparkline />
          <View
            style={{
              flexDirection: 'row',
              gap: 12,
              paddingTop: 12,
              marginTop: 10,
              borderTopWidth: 1,
              borderTopColor: 'rgba(22,20,15,0.06)',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: fontWeight.black, color: colors.ink }}>4.8k</Text>
              <Text style={{ fontSize: 9, fontWeight: fontWeight.bold, color: colors.inkSoft, marginTop: 2, letterSpacing: 1.6 }}>BEST</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: fontWeight.black, color: colors.ink }}>12</Text>
              <Text style={{ fontSize: 9, fontWeight: fontWeight.bold, color: colors.inkSoft, marginTop: 2, letterSpacing: 1.6 }}>STREAK</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: fontWeight.black, color: colors.ember }}>×7</Text>
              <Text style={{ fontSize: 9, fontWeight: fontWeight.bold, color: colors.inkSoft, marginTop: 2, letterSpacing: 1.6 }}>COMBO</Text>
            </View>
          </View>
        </GlassCard>

        {/* Quick navigation grid */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <NavTile href="/leaderboard" testID="leaderboard-button" label="Leaderboard" hint="Today's standings" accent={colors.cobalt} />
          <NavTile href="/replays" testID="replays-button" label="Replays" hint="Watch ghosts" accent={colors.plum} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <NavTile href="/shop" testID="shop-button" label="Shop" hint="Themes" accent={colors.mustard} />
          <NavTile href="/achievements" testID="achievements-button" label="Achievements" hint="6 badges" accent={colors.forest} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <NavTile href="/share" testID="share-button" label="Share" hint="Your grid" accent={colors.rose} />
          <NavTile href="/settings" testID="settings-nav" label="Settings" hint="Audio · theme" accent={colors.teal} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
