// src/components/paywall/PaywallModal.tsx
import { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { PACKAGE_TYPE } from 'react-native-purchases';
import { GlassCard } from '@/components/design/GlassCard';
import { Pill } from '@/components/design/Pill';
import { TactileButton } from '@/components/design/TactileButton';
import { colors, fontWeight } from '@/lib/design/tokens';
import { useSubscription } from '@/lib/subscription/state';
import { track } from '@/lib/analytics/events';

export type PaywallSource = 'archive' | 'theme_apply' | 'gif_export';

export interface PaywallModalProps {
  visible: boolean;
  source: PaywallSource;
  onDismiss: () => void;
}

export function PaywallModal({ visible, source, onDismiss }: PaywallModalProps) {
  const { offering, purchase, restore } = useSubscription();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) track('paywall_viewed', { source });
  }, [visible, source]);

  if (!visible) return null;

  const monthly =
    offering?.availablePackages.find((p) => p.packageType === PACKAGE_TYPE.MONTHLY) ?? null;
  const annual =
    offering?.availablePackages.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL) ?? null;

  const onPurchase = async (pkg: PurchasesPackage | null) => {
    if (!pkg) return;
    setBusy(true);
    const success = await purchase(pkg);
    setBusy(false);
    if (success) {
      track('subscription_purchased', {
        tier: pkg.packageType === PACKAGE_TYPE.ANNUAL ? 'annual' : 'monthly',
        trial: pkg.packageType === PACKAGE_TYPE.ANNUAL,
      });
      onDismiss();
    }
  };

  const onRestore = async () => {
    setBusy(true);
    await restore();
    setBusy(false);
  };

  const onClose = () => {
    track('paywall_dismissed', { source });
    onDismiss();
  };

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(22,20,15,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        zIndex: 30,
      }}
    >
      <GlassCard style={{ padding: 24, maxWidth: 380, width: '100%' }}>
        <Pill variant="ember">BLOCK MERGE+</Pill>
        <Text
          style={{
            fontSize: 26,
            fontWeight: fontWeight.black,
            color: colors.ink,
            marginTop: 14,
            letterSpacing: -1,
          }}
        >
          Unlock the full game
        </Text>
        <Text
          style={{ color: colors.inkSoft, marginTop: 8, fontSize: 14, lineHeight: 20 }}
        >
          Daily archive · cosmetic themes · no ads · GIF replay export.
        </Text>

        {!offering && (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <ActivityIndicator />
            <Text style={{ color: colors.inkSoft, marginTop: 12, fontSize: 12 }}>
              Loading offers…
            </Text>
          </View>
        )}

        {offering && (
          <View style={{ marginTop: 18, gap: 10 }}>
            {annual && (
              <TactileButton
                testID="paywall-annual-button"
                variant="primary"
                onPress={() => void onPurchase(annual)}
              >
                {`${annual.product.priceString} / year — 7-day free trial`}
              </TactileButton>
            )}
            {monthly && (
              <TactileButton
                testID="paywall-monthly-button"
                variant="cobalt"
                onPress={() => void onPurchase(monthly)}
              >
                {`${monthly.product.priceString} / month`}
              </TactileButton>
            )}
          </View>
        )}

        {busy && (
          <View style={{ marginTop: 12, alignItems: 'center' }}>
            <ActivityIndicator />
          </View>
        )}

        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}
        >
          <Pressable testID="paywall-restore-button" onPress={() => void onRestore()} disabled={busy}>
            <Text
              style={{
                color: colors.inkSoft,
                fontSize: 13,
                fontWeight: fontWeight.semibold,
              }}
            >
              Restore purchases
            </Text>
          </Pressable>
          <Pressable testID="paywall-close-button" onPress={onClose} disabled={busy}>
            <Text
              style={{
                color: colors.inkSoft,
                fontSize: 13,
                fontWeight: fontWeight.semibold,
              }}
            >
              Close
            </Text>
          </Pressable>
        </View>
      </GlassCard>
    </View>
  );
}
