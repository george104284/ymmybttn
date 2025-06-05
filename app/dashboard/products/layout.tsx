import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
        <p className="text-gray-600">Manage your global product catalog and restaurant assignments</p>
      </div>

      <nav className="flex space-x-4 border-b border-gray-200">
        <Link
          href="/dashboard/products"
          className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
        >
          Product Catalog
        </Link>
        <Link
          href="/dashboard/products/categories"
          className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
        >
          Categories
        </Link>
        <Link
          href="/dashboard/products/restaurant"
          className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
        >
          Restaurant Products
        </Link>
        <Link
          href="/dashboard/products/distributor-specs"
          className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
        >
          Distributor Specs
        </Link>
      </nav>

      <div>{children}</div>
    </div>
  )
}