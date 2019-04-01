import React from "react";
import { TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";

const IconButton = ({ icon, size, color, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.container}>
        <Icon name={icon} size={size} color={color} />
      </View>
    </TouchableOpacity>
  );
}

const styles = {
  container: {
    marginRight: 10
  }
}

export default IconButton;