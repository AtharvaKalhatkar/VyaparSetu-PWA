import { DB } from './storage'
import { formatCurrency, formatDate } from './formatting'
import type { Invoice } from '../types'

// Web Bluetooth Characteristic UUID for ESC/POS Thermal Printers
const PRINTER_SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb' // Standard printer service
const PRINTER_CHARACTERISTIC_UUID = '00002af1-0000-1000-8000-00805f9b34fb'

export class EscPosEncoder {
  private buffer: number[] = []

  init(): this {
    this.buffer.push(0x1B, 0x40) // ESC @
    return this
  }

  alignCenter(): this {
    this.buffer.push(0x1B, 0x61, 0x01) // ESC a 1
    return this
  }

  alignLeft(): this {
    this.buffer.push(0x1B, 0x61, 0x00) // ESC a 0
    return this
  }

  alignRight(): this {
    this.buffer.push(0x1B, 0x61, 0x02) // ESC a 2
    return this
  }

  bold(enable: boolean = true): this {
    this.buffer.push(0x1B, 0x45, enable ? 0x01 : 0x00) // ESC E n
    return this
  }

  doubleSize(enable: boolean = true): this {
    this.buffer.push(0x1D, 0x21, enable ? 0x11 : 0x00) // GS ! n
    return this
  }

  text(str: string): this {
    const encoder = new TextEncoder()
    const bytes = encoder.encode(str)
    for (const b of bytes) this.buffer.push(b)
    return this
  }

  line(str: string = ''): this {
    if (str) this.text(str)
    this.buffer.push(0x0A) // LF
    return this
  }

  divider(cols: number = 32): this {
    return this.line('-'.repeat(cols))
  }

  feed(lines: number = 3): this {
    this.buffer.push(0x1B, 0x64, lines) // ESC d n
    return this
  }

  cut(): this {
    this.buffer.push(0x1D, 0x56, 0x42, 0x00) // GS V 66 0
    return this
  }

  getBytes(): Uint8Array {
    return new Uint8Array(this.buffer)
  }
}

export async function printThermalInvoice(inv: Invoice, widthMm: 58 | 80 = 58): Promise<boolean> {
  const cols = widthMm === 80 ? 48 : 32
  const profile = DB.businessProfile.get()

  const encoder = new EscPosEncoder()
  encoder.init()

  // Header
  encoder.alignCenter().doubleSize(true).bold(true).line(profile.businessName || 'VYAPAR SETU').doubleSize(false)
  if (profile.address) encoder.line(profile.address.slice(0, cols))
  if (profile.phone) encoder.line(`Ph: ${profile.phone}`)
  if (profile.gstin) encoder.line(`GSTIN: ${profile.gstin}`)
  encoder.divider(cols)

  // Document Info
  encoder.alignLeft().bold(true).line(`Invoice No: ${inv.invoiceNo}`)
  encoder.bold(false).line(`Date: ${formatDate(inv.date)}`)
  encoder.line(`Party: ${inv.partyName}`)
  encoder.divider(cols)

  // Line items
  // Format: Item Name (line 1), Qty x Rate = Total (line 2)
  encoder.bold(true).line(`ITEM                 QTY   AMT`)
  encoder.bold(false).divider(cols)

  inv.items.forEach(item => {
    const nameTruncated = item.itemName.length > 18 ? item.itemName.slice(0, 17) + '.' : item.itemName.padEnd(18, ' ')
    const qtyStr = `${item.quantity}${item.unit ? item.unit.slice(0, 3) : ''}`.padStart(5, ' ')
    const amtStr = `₹${item.amount}`.padStart(7, ' ')
    encoder.line(`${nameTruncated}${qtyStr}${amtStr}`)
  })
  encoder.divider(cols)

  // Totals
  encoder.alignRight()
  encoder.line(`Subtotal: ${formatCurrency(inv.subtotal)}`)
  if (inv.discountAmount) encoder.line(`Discount: -${formatCurrency(inv.discountAmount)}`)
  if (inv.taxAmount) encoder.line(`GST Tax: ${formatCurrency(inv.taxAmount)}`)
  encoder.bold(true).doubleSize(false).line(`GRAND TOTAL: ${formatCurrency(inv.grandTotal)}`)
  encoder.bold(false)

  if (inv.paidAmount) encoder.line(`Paid: ${formatCurrency(inv.paidAmount)}`)
  if (inv.dueAmount) encoder.line(`Due: ${formatCurrency(inv.dueAmount)}`)

  encoder.divider(cols)
  encoder.alignCenter().bold(true).line(`Status: ${inv.paymentStatus}`)
  encoder.bold(false).line('Thank you! Visit Again').feed(3).cut()

  const payload = encoder.getBytes()

  // Attempt Web Bluetooth API connection
  if ('bluetooth' in navigator) {
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [PRINTER_SERVICE_UUID, '000018f0-0000-1000-8000-00805f9b34fb'],
      })

      const server = await device.gatt.connect()
      let service: any
      try {
        service = await server.getPrimaryService(PRINTER_SERVICE_UUID)
      } catch {
        const services = await server.getPrimaryServices()
        if (services.length > 0) service = services[0]
      }

      if (service) {
        const characteristics = await service.getCharacteristics()
        const writeChar = characteristics.find((c: any) => c.properties.write || c.properties.writeWithoutResponse)
        if (writeChar) {
          // Send in chunks of 512 bytes
          const chunkSize = 512
          for (let i = 0; i < payload.length; i += chunkSize) {
            const chunk = payload.slice(i, i + chunkSize)
            await writeChar.writeValue(chunk)
          }
          return true
        }
      }
    } catch (err) {
      console.warn('Bluetooth print cancelled or unsupported, opening browser print dialog fallback.', err)
    }
  }

  // Fallback to Window Print
  window.print()
  return true
}
