'use client'

/**
 * Receive assets — IMG_4299's sheet, with the demo's one substitution.
 *
 * Today Tangem prints "Ethereum address" over a full 42-character hex string.
 * Here the name comes first and the address sits under it, one tap away: the
 * thing you hand somebody is `harpreet.tange.eth`, and the hex is the detail
 * you can still check. Everything else about the sheet is unchanged — the same
 * white body, the same Show QR code / Copy / Share controls, the same
 * wrong-network warning bar with its blue info glyph.
 *
 * Two honest cases the real sheet never has to handle:
 *
 *  - The wallet has no name (the user ticked *Continue without a name*), or the
 *    name has no record for this network yet. Then the sheet falls back to
 *    exactly what Tangem does today, address first.
 *  - The network is not EVM. A Bitcoin or Solana wallet does not resolve ENS,
 *    so the QR carries the address and says so, rather than shipping a QR that
 *    scans into a string the other wallet cannot use.
 */

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { CHAIN_BY_KEY, NETWORK_BY_ID } from '@/lib/chains'
import { assetForNetwork } from '@/lib/assets'
import { fullAddress } from '@/lib/format'
import { useWallet } from '../store'
import { Sheet } from '../components/Shell'
import { NetworkMark } from '../components/CoinMark'
import { ChevronDown, ChevronUp, Copy, Info, QrCode, Share } from '../components/Icons'

export interface ReceiveProps {
  networkId: string
}

export function Receive({ networkId }: ReceiveProps) {
  const { closeSheet, addressForNetwork, ensName, showToast } = useWallet()
  const [showAddress, setShowAddress] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const [qr, setQr] = useState('')

  const network = NETWORK_BY_ID[networkId]
  const asset = assetForNetwork(networkId)
  const address = addressForNetwork(networkId)
  const chain = network?.chain
  const spec = chain ? CHAIN_BY_KEY[chain] : undefined

  // The name only stands in for this network once its address record is
  // actually written. Reading it back from the name rather than assuming it is
  // what keeps the sheet from promising a record the registry does not hold.
  const named = chain && ensName?.addresses[chain] === address ? ensName : null

  // ENS is an EVM convention. Encoding a name into a QR for a Bitcoin or Solana
  // wallet would produce something no scanner on that side can spend to.
  const qrCarriesName = Boolean(named && spec?.evm)
  const qrValue = qrCarriesName && named ? named.fullName : address

  useEffect(() => {
    if (!showQr || !qrValue) return
    let cancelled = false
    QRCode.toDataURL(qrValue, {
      margin: 0,
      width: 560,
      color: { dark: '#1E1E1E', light: '#FFFFFF' },
    })
      .then((url) => {
        if (!cancelled) setQr(url)
      })
      .catch(() => {
        if (!cancelled) setQr('')
      })
    return () => {
      cancelled = true
    }
  }, [showQr, qrValue])

  if (!network || !asset) return null

  const primary = named ? named.fullName : address
  const primaryLabel = named ? 'Name' : 'Address'

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text)
      showToast(`${what} copied`)
    } catch {
      showToast('Could not copy')
    }
  }

  async function share() {
    const text = primary
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ text, title: `My ${network.network} address` })
        return
      } catch {
        // A cancelled share is not an error; fall through to the copy fallback.
      }
    }
    await copy(text, primaryLabel)
  }

  return (
    <Sheet title="Receive assets" onClose={closeSheet} plain>
      <style>{CSS}</style>

      <div className="rc">
        <NetworkMark networkId={networkId} size={43} label={asset.name} />

        {named ? (
          <>
            <p className="rc__name">{named.fullName}</p>
            <p className="rc__note">
              Receives {network.ticker} on {network.network}
            </p>
            <button
              className="rc__disclose"
              onClick={() => setShowAddress((open) => !open)}
              aria-expanded={showAddress}
            >
              {showAddress ? 'Hide' : 'Show'} {network.network} address
              {showAddress ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showAddress && (
              <button
                className="mono rc__address"
                onClick={() => copy(address, 'Address')}
                title="Tap to copy"
              >
                {fullAddress(address)}
              </button>
            )}
          </>
        ) : (
          <>
            <p className="rc__name">{network.network} address</p>
            <button
              className="mono rc__address rc__address--bare"
              onClick={() => copy(address, 'Address')}
              title="Tap to copy"
            >
              {fullAddress(address)}
            </button>
            <p className="rc__note">
              {chain
                ? 'This wallet has no name yet. Name it and this becomes one line.'
                : network.reason}
            </p>
          </>
        )}

        <button className="rc__qr-toggle" onClick={() => setShowQr((open) => !open)}>
          <QrCode size={20} />
          {showQr ? 'Hide QR code' : 'Show QR code'}
        </button>

        {showQr && (
          <div className="rc__qr">
            {qr ? (
              <img src={qr} alt={`QR code for ${qrValue}`} width={172} height={172} />
            ) : (
              <div className="rc__qr-placeholder" />
            )}
            <p className="rc__qr-note">
              {qrCarriesName
                ? 'This code carries the name.'
                : `This code carries the address — ${network.network} wallets do not read ENS.`}
            </p>
          </div>
        )}

        <div className="rc__actions">
          <button className="pill pill--light rc__pill" onClick={() => copy(primary, primaryLabel)}>
            <Copy size={20} />
            Copy
          </button>
          <button className="pill pill--light rc__pill" onClick={share}>
            <Share size={20} />
            Share
          </button>
        </div>

        <div className="rc__warning">
          <div className="rc__warning-text">
            <p className="rc__warning-title">
              Send only {network.ticker} on the {network.network} network
            </p>
            <p className="rc__warning-sub">
              Sending any other currency will result in its irreversible loss.
            </p>
          </div>
          <Info size={22} className="rc__warning-icon" />
        </div>
      </div>
    </Sheet>
  )
}

const CSS = `
.rc {
  display: grid;
  justify-items: center;
  padding-top: 22px;
  text-align: center;
}

.rc__name {
  margin-top: 20px;
  font-size: 17px;
  font-weight: var(--fw-semibold);
  color: var(--text-1);
  word-break: break-word;
}

.rc__note {
  margin-top: 4px;
  font-size: var(--fs-sub);
  color: var(--text-3);
  max-width: 300px;
  line-height: var(--lh-body);
}

.rc__disclose {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
  font-size: var(--fs-label);
  font-weight: var(--fw-semibold);
  color: var(--accent);
}

.rc__address {
  margin-top: 8px;
  padding: 0 8px;
  max-width: 340px;
  text-align: center;
  line-height: var(--lh-body);
  cursor: pointer;
}

.rc__address--bare { margin-top: 6px; }

.rc__qr-toggle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
  font-size: 16px;
  font-weight: var(--fw-semibold);
  color: var(--text-1);
}

.rc__qr {
  display: grid;
  justify-items: center;
  margin-top: 16px;
}

.rc__qr img,
.rc__qr-placeholder {
  width: 172px;
  height: 172px;
  border-radius: 12px;
  background: var(--bg-subtle-2);
}

.rc__qr-note {
  margin-top: 10px;
  max-width: 280px;
  font-size: var(--fs-sub);
  color: var(--text-3);
  line-height: var(--lh-body);
}

.rc__actions {
  display: flex;
  gap: 16px;
  margin-top: 22px;
}

.rc__pill {
  height: 44px;
  padding: 0 22px;
  font-size: 16px;
  font-weight: var(--fw-medium);
}

.rc__pill:active { opacity: .7; }

.rc__warning {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin-top: 26px;
  padding: 12px 16px;
  border-radius: 20px;
  background: var(--bg-notice);
  text-align: left;
}

.rc__warning-text { flex: 1; min-width: 0; }

.rc__warning-title {
  font-size: var(--fs-label);
  font-weight: var(--fw-semibold);
  color: var(--text-1);
}

.rc__warning-sub {
  margin-top: 2px;
  font-size: var(--fs-sub);
  color: var(--text-3);
}

.rc__warning-icon { color: var(--accent); flex: none; }
`

export default Receive
