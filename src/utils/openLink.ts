import * as WebBrowser from 'expo-web-browser';
import { Linking, Platform } from 'react-native';

import type { AppLinks } from '../api/types';
import { t } from '../i18n/i18n';
import { colors } from '../theme';
import { notify } from './confirm';

/**
 * Opens a web page (privacy policy, terms, support, deletion page) in the in-app browser
 * (SFSafariViewController / Custom Tabs) — a new tab on web. `mailto:` and store links go to the system.
 */
export async function openLink(url: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer');
      return true;
    }
    if (/^https?:\/\//i.test(url)) {
      await WebBrowser.openBrowserAsync(url, {
        controlsColor: colors.ink,
        toolbarColor: colors.background,
        dismissButtonStyle: 'close',
      });
      return true;
    }
    await Linking.openURL(url);
    return true;
  } catch {
    notify(t('legal.openFailed'), url);
    return false;
  }
}

/** Store pages open in the App Store / Play Store app rather than the in-app browser. */
export async function openExternal(url: string): Promise<boolean> {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return openLink(url);
  }
}

/** Support page, else a mail to the support address, else null. */
export function supportUrl(links: AppLinks): string | null {
  if (links.support) return links.support;
  if (links.supportEmail) return `mailto:${links.supportEmail}`;
  return null;
}

/** Store listing of this app for the current platform. */
export function storeUrl(links: AppLinks, platform: string = Platform.OS): string | null {
  if (platform === 'ios') return links.appStore;
  if (platform === 'android') return links.playStore;
  return null;
}
