"use client"

import { useEffect, useRef } from "react"

export function FlowCoverageMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Mock data for the flow coverage map
    const pages = [
      { id: "home", name: "Home", x: 100, y: 50, visited: true },
      { id: "products", name: "Products", x: 250, y: 50, visited: true },
      { id: "product-detail", name: "Product Detail", x: 400, y: 50, visited: true },
      { id: "cart", name: "Cart", x: 550, y: 50, visited: true },
      { id: "checkout", name: "Checkout", x: 400, y: 150, visited: true },
      { id: "payment", name: "Payment", x: 250, y: 150, visited: false },
      { id: "confirmation", name: "Confirmation", x: 100, y: 150, visited: false },
      { id: "account", name: "Account", x: 100, y: 250, visited: true },
      { id: "settings", name: "Settings", x: 250, y: 250, visited: false },
      { id: "orders", name: "Orders", x: 400, y: 250, visited: false },
    ]

    const connections = [
      { from: "home", to: "products" },
      { from: "products", to: "product-detail" },
      { from: "product-detail", to: "cart" },
      { from: "cart", to: "checkout" },
      { from: "checkout", to: "payment" },
      { from: "payment", to: "confirmation" },
      { from: "home", to: "account" },
      { from: "account", to: "settings" },
      { from: "account", to: "orders" },
    ]

    // Draw connections
    connections.forEach((connection) => {
      const fromPage = pages.find((page) => page.id === connection.from)
      const toPage = pages.find((page) => page.id === connection.to)

      if (fromPage && toPage) {
        ctx.beginPath()
        ctx.moveTo(fromPage.x, fromPage.y)
        ctx.lineTo(toPage.x, toPage.y)

        // Check if both pages are visited
        if (fromPage.visited && toPage.visited) {
          ctx.strokeStyle = "#22c55e" // Green for visited paths
          ctx.lineWidth = 2
        } else if (fromPage.visited || toPage.visited) {
          ctx.strokeStyle = "#f97316" // Orange for partially visited paths
          ctx.lineWidth = 1.5
        } else {
          ctx.strokeStyle = "#d1d5db" // Gray for unvisited paths
          ctx.lineWidth = 1
        }

        ctx.stroke()
      }
    })

    // Draw pages
    pages.forEach((page) => {
      ctx.beginPath()
      ctx.arc(page.x, page.y, 20, 0, 2 * Math.PI)

      if (page.visited) {
        ctx.fillStyle = "#22c55e" // Green for visited pages
      } else {
        ctx.fillStyle = "#d1d5db" // Gray for unvisited pages
      }

      ctx.fill()

      // Add page name
      ctx.fillStyle = "#000000"
      ctx.font = "10px Arial"
      ctx.textAlign = "center"
      ctx.fillText(page.name, page.x, page.y + 30)
    })
  }, [])

  return <canvas ref={canvasRef} className="w-full h-full" />
}
