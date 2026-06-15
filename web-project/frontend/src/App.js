import './App.css';
import { Route, Routes } from 'react-router-dom';
import Map from './map/Map';
import App1 from './congestion/App1';
import ZoneDetail from './congestion/ZoneDetail';
import MainPage from './mainPage/mainPage';
import Login from './login/Login';
import SignUp from './login/SignUp';
import MyPage from './myPage/myPage';
import NotFound from './NotFound';
import RestaurantInfo from './restaurantInfo/RestaurantInfo';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/main" element={<MainPage />} />
      <Route path="/map" element={<Map />} />
      <Route path="/congestion" element={<App1 />} />
      <Route path="/congestion/:zoneId" element={<ZoneDetail />} />
      <Route path="/info" element={<RestaurantInfo />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/mypage" element={<MyPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
