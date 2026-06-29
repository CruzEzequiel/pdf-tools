import { Routes, Route } from 'react-router-dom'
import Home from '../pages/public/home/Home'
import Merge from '../pages/tools/merge/Merge'
import Split from '../pages/tools/split/Split'
import Extract from '../pages/tools/extract/Extract'
import Reorder from '../pages/tools/reorder/Reorder'
import Rotate from '../pages/tools/rotate/Rotate'
import ImgToPdf from '../pages/tools/img-to-pdf/ImgToPdf'
import PdfToImg from '../pages/tools/pdf-to-img/PdfToImg'

const AppRoutes = () => (
  <Routes>
    <Route path="/"           element={<Home />} />
    <Route path="/merge"      element={<Merge />} />
    <Route path="/split"      element={<Split />} />
    <Route path="/extract"    element={<Extract />} />
    <Route path="/reorder"    element={<Reorder />} />
    <Route path="/rotate"     element={<Rotate />} />
    <Route path="/img-to-pdf" element={<ImgToPdf />} />
    <Route path="/pdf-to-img" element={<PdfToImg />} />
  </Routes>
)

export default AppRoutes
